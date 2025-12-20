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
