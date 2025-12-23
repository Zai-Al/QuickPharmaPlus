using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.WishList_Cart;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class WishlistRepository : IWishlistRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public WishlistRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        public async Task<(List<WishlistItemDto> Items, int TotalCount)> GetMyPagedAsync(int userId, int page, int pageSize)
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 ? 12 : pageSize;
            pageSize = Math.Min(pageSize, 50); // hard cap

            var baseQuery =
                from w in _context.WishLists
                join p in _context.Products on w.ProductId equals p.ProductId
                where w.UserId == userId && w.ProductId.HasValue
                select new { w, p };

            var totalCount = await baseQuery.CountAsync();

            var items = await baseQuery
                .OrderByDescending(x => x.w.WishListId) 
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new WishlistItemDto
                {
                    ProductId = x.p.ProductId,
                    Name = x.p.ProductName,
                    Price = x.p.ProductPrice,

                    CategoryName = x.p.Category != null ? x.p.Category.CategoryName : null,
                    ProductTypeName = x.p.ProductType != null ? x.p.ProductType.ProductTypeName : null,

                    RequiresPrescription = (x.p.CategoryId == 1) || (x.p.Category != null && x.p.Category.CategoryId == 1),

                    InventoryCount = _context.Inventories
                        .Where(i => i.ProductId == x.p.ProductId && (i.InventoryQuantity ?? 0) > 0)
                        .Sum(i => (int?)(i.InventoryQuantity ?? 0)) ?? 0
                })
                .AsNoTracking()
                .ToListAsync();

            foreach (var it in items)
            {
                it.StockStatus =
                    it.InventoryCount <= 0 ? "OUT_OF_STOCK" :
                    it.InventoryCount <= 5 ? "LOW_STOCK" :
                    "IN_STOCK";
            }

            return (items, totalCount);
        }

        public async Task<bool> AddAsync(int userId, int productId)
        {
            var exists = await _context.WishLists
                .AnyAsync(w => w.UserId == userId && w.ProductId == productId);

            if (exists) return false;

            var productExists = await _context.Products.AnyAsync(p => p.ProductId == productId);
            if (!productExists) return false;

            _context.WishLists.Add(new WishList
            {
                UserId = userId,
                ProductId = productId
            });

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveAsync(int userId, int productId)
        {
            var existing = await _context.WishLists
                .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

            if (existing == null) return false;

            _context.WishLists.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<HashSet<int>> GetMyIdsAsync(int userId)
        {
            var ids = await _context.WishLists
                .Where(w => w.UserId == userId && w.ProductId.HasValue)
                .Select(w => w.ProductId!.Value)
                .ToListAsync();

            return ids.ToHashSet();
        }

        public async Task<List<WishlistItemDto>> GetMyAsync(int userId)
        {
            var items = await (
                from w in _context.WishLists
                join p in _context.Products on w.ProductId equals p.ProductId
                where w.UserId == userId && w.ProductId.HasValue
                select new WishlistItemDto
                {
                    ProductId = p.ProductId,
                    Name = p.ProductName,
                    Price = p.ProductPrice,

                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    ProductTypeName = p.ProductType != null ? p.ProductType.ProductTypeName : null,

                    RequiresPrescription = (p.CategoryId == 1) || (p.Category != null && p.Category.CategoryId == 1),

                    InventoryCount = _context.Inventories
                        .Where(i => i.ProductId == p.ProductId && (i.InventoryQuantity ?? 0) > 0)
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

    }
}
