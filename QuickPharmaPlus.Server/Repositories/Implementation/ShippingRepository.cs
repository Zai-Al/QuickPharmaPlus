using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class ShippingRepository : IShippingRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public ShippingRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        // ===============================
        // PICKUP SHIPPING
        // ===============================
        public async Task<Shipping> CreatePickupAsync(int userId, int branchId)
        {
            // (Optional) Validate branch exists
            var branchExists = await _context.Branches.AnyAsync(b => b.BranchId == branchId);
            if (!branchExists)
                throw new ArgumentException("Invalid branchId.");

            var shipping = new Shipping
            {
                UserId = userId,
                BranchId = branchId,
                AddressId = null,
                ShippingSlotId = null,

                ShippingIsUrgent = false,
                ShippingIsDelivery = false,
                ShippingDate = DateTime.UtcNow
            };

            _context.Shippings.Add(shipping);
            await _context.SaveChangesAsync();

            return shipping;
        }

        // ===============================
        // DELIVERY SHIPPING
        // ===============================

        public async Task<Shipping> CreateDeliveryAsync(
            int userId,
            int cityId,
            string block,
            string road,
            string buildingNumber,
            IEnumerable<int> productIds
        )
        {
            // 1) Resolve branch from City
            var assignedBranchId = await _context.Cities
                .Where(c => c.CityId == cityId)
                .Select(c => c.BranchId)
                .FirstOrDefaultAsync();

            if (assignedBranchId == null)
                throw new InvalidOperationException("This city is not assigned to any branch.");

            // 2) Create Address
            var address = new Address
            {
                CityId = cityId,
                Block = block,
                Street = road,
                BuildingNumber = buildingNumber,
                IsProfileAdress = false
            };

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            // 3) Stock check in assigned branch (sets ShippingIsDelivery)
            var hasStockForAll = await HasStockForAllProductsAsync(
                assignedBranchId.Value,
                productIds,
                ignoreExpired: true
            );

            // 4) Create Shipping
            var shipping = new Shipping
            {
                UserId = userId,
                BranchId = assignedBranchId.Value,
                AddressId = address.AddressId,
                ShippingSlotId = null,

                ShippingIsUrgent = false,
                ShippingIsDelivery = hasStockForAll, // TRUE only if stock exists
                ShippingDate = DateTime.UtcNow
            };

            _context.Shippings.Add(shipping);
            await _context.SaveChangesAsync();

            return shipping;
        }

        public async Task<Shipping> CreateDeliveryByProductNamesAsync(
    int userId,
    int cityId,
    string block,
    string road,
    string buildingNumber,
    IEnumerable<string> productNames
)
        {
            var names = (productNames ?? Enumerable.Empty<string>())
                .Select(x => (x ?? "").Trim())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .ToList();

            // map names to ids (temporary until Approval stores ProductId)
            var productIds = await _context.Products
                .Where(p => p.ProductName != null && names.Contains(p.ProductName))
                .Select(p => p.ProductId)
                .Distinct()
                .ToListAsync();

            return await CreateDeliveryAsync(userId, cityId, block, road, buildingNumber, productIds);
        }


        // ===============================
        // STOCK CHECK: ALL PRODUCTS IN BRANCH
        // ===============================
        public async Task<bool> HasStockForAllProductsAsync(int branchId, IEnumerable<int> productIds, bool ignoreExpired = true)
        {
            var ids = (productIds ?? Enumerable.Empty<int>())
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            // If no products, treat as "no stock"
            if (ids.Count == 0) return false;

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            // Only inventory rows for this branch + these products
            var query = _context.Inventories
                .AsNoTracking()
                .Where(i =>
                    i.BranchId == branchId &&
                    i.ProductId.HasValue &&
                    ids.Contains(i.ProductId.Value)
                );

            // Ignore expired inventory if requested
            if (ignoreExpired)
            {
                query = query.Where(i =>
                    !i.InventoryExpiryDate.HasValue || i.InventoryExpiryDate.Value >= today
                );
            }

            // Group by product and sum quantities; every requested product must have sum > 0
            var grouped = await query
                .GroupBy(i => i.ProductId!.Value)
                .Select(g => new
                {
                    ProductId = g.Key,
                    Qty = g.Sum(x => x.InventoryQuantity ?? 0)
                })
                .ToListAsync();

            // Build map
            var qtyMap = grouped.ToDictionary(x => x.ProductId, x => x.Qty);

            // Every product in ids must exist in map with qty > 0
            foreach (var pid in ids)
            {
                if (!qtyMap.TryGetValue(pid, out var qty)) return false;
                if (qty <= 0) return false;
            }

            return true;
        }
    }
}
