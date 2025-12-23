using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.WishList_Cart;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class CartRepository : ICartRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public CartRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        private async Task<int> GetAvailableStockAsync(int productId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            return await _context.Inventories
                .Where(i => i.ProductId == productId)
                .Where(i => (i.InventoryQuantity ?? 0) > 0)
                .Where(i => i.InventoryExpiryDate == null || i.InventoryExpiryDate >= today)
                .SumAsync(i => (int?)(i.InventoryQuantity ?? 0)) ?? 0;
        }

        public async Task<List<CartItemDto>> GetMyAsync(int userId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            // Join cart -> product (same style as wishlist join)
            var items = await (
                from c in _context.Carts
                join p in _context.Products on c.ProductId equals p.ProductId
                where c.UserId == userId && c.ProductId.HasValue
                select new CartItemDto
                {
                    CartItemId = c.CartItemId,
                    ProductId = p.ProductId,
                    Name = p.ProductName,
                    Price = p.ProductPrice,

                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    ProductTypeName = p.ProductType != null ? p.ProductType.ProductTypeName : null,

                    RequiresPrescription = (p.CategoryId == 1) || (p.Category != null && p.Category.CategoryId == 1),

                    CartQuantity = c.CartItemQuantity ?? 0,

                    // available stock (ignore expired + ignore 0)
                    InventoryCount = _context.Inventories
                        .Where(i => i.ProductId == p.ProductId)
                        .Where(i => (i.InventoryQuantity ?? 0) > 0)
                        .Where(i => i.InventoryExpiryDate == null || i.InventoryExpiryDate >= today)
                        .Sum(i => (int?)(i.InventoryQuantity ?? 0)) ?? 0
                }
            )
            .AsNoTracking()
            .ToListAsync();

            foreach (var x in items)
            {
                x.StockStatus =
                    x.InventoryCount <= 0 ? "OUT_OF_STOCK" :
                    x.InventoryCount <= 5 ? "LOW_STOCK" :
                    "IN_STOCK";
            }

            return items;
        }

        public async Task<(bool added, string reason)> AddAsync(int userId, int productId, int quantity)
        {
            if (userId <= 0) return (false, "INVALID_USER");
            if (productId <= 0) return (false, "INVALID_PRODUCT");
            if (quantity <= 0) return (false, "INVALID_QTY");

            var productExists = await _context.Products.AnyAsync(p => p.ProductId == productId);
            if (!productExists) return (false, "PRODUCT_NOT_FOUND");

            var available = await GetAvailableStockAsync(productId);
            if (available <= 0) return (false, "OUT_OF_STOCK");

            var existing = await _context.Carts
                .FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == productId);

            var existingQty = existing?.CartItemQuantity ?? 0;

            if (existingQty + quantity > available)
                return (false, "EXCEEDS_AVAILABLE_STOCK");

            if (existing == null)
            {
                _context.Carts.Add(new Cart
                {
                    UserId = userId,
                    ProductId = productId,
                    CartItemQuantity = quantity
                });
            }
            else
            {
                existing.CartItemQuantity = existingQty + quantity;
            }

            await _context.SaveChangesAsync();
            return (true, "OK");
        }

        public async Task<(bool updated, string reason)> UpdateQtyAsync(int userId, int productId, int quantity)
        {
            if (userId <= 0) return (false, "INVALID_USER");
            if (productId <= 0) return (false, "INVALID_PRODUCT");

            var existing = await _context.Carts
                .FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == productId);

            if (existing == null) return (false, "NOT_FOUND");

            // qty <= 0 -> remove (simple UX)
            if (quantity <= 0)
            {
                _context.Carts.Remove(existing);
                await _context.SaveChangesAsync();
                return (true, "REMOVED");
            }

            var available = await GetAvailableStockAsync(productId);
            if (available <= 0) return (false, "OUT_OF_STOCK");
            if (quantity > available) return (false, "EXCEEDS_AVAILABLE_STOCK");

            existing.CartItemQuantity = quantity;
            await _context.SaveChangesAsync();
            return (true, "OK");
        }

        public async Task<bool> RemoveAsync(int userId, int productId)
        {
            var existing = await _context.Carts
                .FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == productId);

            if (existing == null) return false;

            _context.Carts.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> ClearAsync(int userId)
        {
            var rows = await _context.Carts.Where(c => c.UserId == userId).ToListAsync();
            if (rows.Count == 0) return 0;

            _context.Carts.RemoveRange(rows);
            await _context.SaveChangesAsync();
            return rows.Count;
        }

        public async Task<(List<CartItemDto> items, int totalCount)> GetMyPagedAsync(int userId, int page, int pageSize)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 12;

            // total rows for pagination (cart rows)
            var totalCount = await _context.Carts
                .Where(c => c.UserId == userId && c.ProductId.HasValue)
                .CountAsync();

            if (totalCount == 0)
                return (new List<CartItemDto>(), 0);

            var skip = (page - 1) * pageSize;

            // NOTE: order is important for stable paging
            var items = await (
                from c in _context.Carts
                join p in _context.Products on c.ProductId equals p.ProductId
                where c.UserId == userId && c.ProductId.HasValue
                orderby c.CartItemId descending
                select new CartItemDto
                {
                    CartItemId = c.CartItemId,
                    ProductId = p.ProductId,
                    Name = p.ProductName,
                    Price = p.ProductPrice,

                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    ProductTypeName = p.ProductType != null ? p.ProductType.ProductTypeName : null,

                    RequiresPrescription = (p.CategoryId == 1) || (p.Category != null && p.Category.CategoryId == 1),

                    CartQuantity = c.CartItemQuantity ?? 0,

                    InventoryCount = _context.Inventories
                        .Where(i => i.ProductId == p.ProductId)
                        .Where(i => (i.InventoryQuantity ?? 0) > 0)
                        .Where(i => i.InventoryExpiryDate == null || i.InventoryExpiryDate >= today)
                        .Sum(i => (int?)(i.InventoryQuantity ?? 0)) ?? 0
                }
            )
            .AsNoTracking()
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync();

            foreach (var x in items)
            {
                x.StockStatus =
                    x.InventoryCount <= 0 ? "OUT_OF_STOCK" :
                    x.InventoryCount <= 5 ? "LOW_STOCK" :
                    "IN_STOCK";
            }

            return (items, totalCount);
        }

        public async Task<(int totalQuantity, decimal totalAmount, int totalCount)> GetSummaryAsync(int userId)
        {
            // totalCount = number of rows (distinct products)
            // totalQuantity = sum of qty
            // totalAmount = sum(price * qty)
            // joins to Products to get price

            var rows = await (
                from c in _context.Carts
                join p in _context.Products on c.ProductId equals p.ProductId
                where c.UserId == userId && c.ProductId.HasValue
                select new
                {
                    Qty = (int?)(c.CartItemQuantity ?? 0),
                    Price = (decimal?)(p.ProductPrice ?? 0m)
                }
            ).AsNoTracking().ToListAsync();

            var totalCount = rows.Count;
            var totalQuantity = rows.Sum(x => x.Qty ?? 0);
            var totalAmount = rows.Sum(x => (x.Price ?? 0m) * (x.Qty ?? 0));

            return (totalQuantity, totalAmount, totalCount);
        }

        public async Task<(int totalQuantity, decimal totalAmount)> GetCartSummaryAsync(int userId)
        {
            if (userId <= 0) return (0, 0m);

            var rows = await (
                from c in _context.Carts
                join p in _context.Products on c.ProductId equals p.ProductId
                where c.UserId == userId && c.ProductId.HasValue
                select new
                {
                    Qty = (int?)(c.CartItemQuantity ?? 0),
                    Price = (decimal?)(p.ProductPrice ?? 0m)
                }
            )
            .AsNoTracking()
            .ToListAsync();

            var totalQuantity = rows.Sum(x => x.Qty ?? 0);
            var totalAmount = rows.Sum(x => (x.Price ?? 0m) * (x.Qty ?? 0));

            return (totalQuantity, totalAmount);
        }


    }
}
