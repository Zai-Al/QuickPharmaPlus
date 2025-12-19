using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Checkout;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class ShippingRepository : IShippingRepository
    {
        private readonly QuickPharmaPlusDbContext _context;
        private readonly IInventoryRepository _inventoryRepo;

        public ShippingRepository(QuickPharmaPlusDbContext context, IInventoryRepository inventoryRepo)
        {
            _context = context;
            _inventoryRepo = inventoryRepo;
        }

        // ===============================
        // VALIDATE SHIPPING (Checkout Step 1)
        // ===============================
        public async Task<ShippingValidationResultDto> ValidateShippingAsync(CheckoutShippingRequestDto req)
        {
            var result = new ShippingValidationResultDto
            {
                Ok = false,
                BranchId = null,
                UnavailableProductNames = new List<string>(),
                Message = ""
            };

            if (req == null)
            {
                result.Message = "Invalid request.";
                return result;
            }

            // items are required for stock validation
            var items = req.Items ?? new List<CheckoutCartItemDto>();
            if (items.Count == 0)
            {
                result.Message = "Cart items are missing.";
                return result;
            }

            // Resolve branchId based on mode
            int branchId;

            var isPickup = string.Equals(req.Mode, "pickup", StringComparison.OrdinalIgnoreCase);
            var isDelivery = string.Equals(req.Mode, "delivery", StringComparison.OrdinalIgnoreCase);

            if (!isPickup && !isDelivery)
            {
                result.Message = "Invalid shipping mode.";
                return result;
            }

            if (isPickup)
            {
                if (!req.PickupBranchId.HasValue || req.PickupBranchId.Value <= 0)
                {
                    result.Message = "Please select a pickup branch.";
                    return result;
                }

                branchId = req.PickupBranchId.Value;

                // optional: validate branch exists
                var branchExists = await _context.Branches.AnyAsync(b => b.BranchId == branchId);
                if (!branchExists)
                {
                    result.Message = "Invalid branchId.";
                    return result;
                }
            }
            else
            {
                // Delivery -> branch assigned to city
                if (!req.CityId.HasValue || req.CityId.Value <= 0)
                {
                    result.Message = "Please select a city for delivery.";
                    return result;
                }

                var assignedBranchId = await _context.Cities
                    .Where(c => c.CityId == req.CityId.Value)
                    .Select(c => c.BranchId)
                    .FirstOrDefaultAsync();

                if (!assignedBranchId.HasValue || assignedBranchId.Value <= 0)
                {
                    result.Message = "This city is not assigned to any branch.";
                    return result;
                }

                branchId = assignedBranchId.Value;
            }

            // Inventory check (reusable)
            var missing = await _inventoryRepo.GetUnavailableProductsForBranchAsync(branchId, items);

            result.BranchId = branchId;
            result.UnavailableProductNames = missing.Select(x => x.ProductName).ToList();
            result.Ok = result.UnavailableProductNames.Count == 0;

            result.Message = result.Ok
                ? "OK"
                : "Some products are not available in the selected branch.";

            return result;
        }

        // ===============================
        // PICKUP SHIPPING (Final create)
        // ===============================
        public async Task<Shipping> CreatePickupAsync(int userId, int branchId)
        {
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
        // DELIVERY SHIPPING (Final create)
        // NOTE: This creates address + shipping. Validation should be done before calling this.
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

            // 3) (Optional) keep this bool flag if you still want it on Shipping entity
            //    NOTE: This does NOT check quantities. Use ValidateShippingAsync for real validation.
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
                ShippingIsDelivery = hasStockForAll,
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

            var productIds = await _context.Products
                .Where(p => p.ProductName != null && names.Contains(p.ProductName))
                .Select(p => p.ProductId)
                .Distinct()
                .ToListAsync();

            return await CreateDeliveryAsync(userId, cityId, block, road, buildingNumber, productIds);
        }

        // ===============================
        // STOCK CHECK (bool) - legacy / optional
        // ===============================
        public async Task<bool> HasStockForAllProductsAsync(
            int branchId,
            IEnumerable<int> productIds,
            bool ignoreExpired = true
        )
        {
            var ids = (productIds ?? Enumerable.Empty<int>())
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            if (ids.Count == 0) return false;

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var query = _context.Inventories
                .AsNoTracking()
                .Where(i =>
                    i.BranchId == branchId &&
                    i.ProductId.HasValue &&
                    ids.Contains(i.ProductId.Value)
                );

            if (ignoreExpired)
            {
                query = query.Where(i =>
                    !i.InventoryExpiryDate.HasValue || i.InventoryExpiryDate.Value >= today
                );
            }

            var grouped = await query
                .GroupBy(i => i.ProductId!.Value)
                .Select(g => new
                {
                    ProductId = g.Key,
                    Qty = g.Sum(x => x.InventoryQuantity ?? 0)
                })
                .ToListAsync();

            var qtyMap = grouped.ToDictionary(x => x.ProductId, x => x.Qty);

            foreach (var pid in ids)
            {
                if (!qtyMap.TryGetValue(pid, out var qty)) return false;
                if (qty <= 0) return false;
            }

            return true;
        }
    }
}
