using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Prescription;
using QuickPharmaPlus.Server.ModelsDTO.PrescriptionPlan;
using QuickPharmaPlus.Server.Repositories.Interface;
using QuickPharmaPlus.Server.Services;


namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class PrescriptionPlanRepository : IPrescriptionPlanRepository
    {
        private readonly QuickPharmaPlusDbContext _context;
        private readonly IShippingRepository _shippingRepository;
        private readonly IPrescriptionPlanEmailLogService _emailLogService;



        public PrescriptionPlanRepository(
    QuickPharmaPlusDbContext context,
    IShippingRepository shippingRepository,
    IPrescriptionPlanEmailLogService emailLogService
)
        {
            _context = context;
            _shippingRepository = shippingRepository;
            _emailLogService = emailLogService;
        }




        // ===============================
        // ELIGIBLE PRESCRIPTIONS
        // ===============================
        public async Task<List<PrescriptionPlanEligibleDto>> GetEligiblePrescriptionsAsync(int userId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            // Auto-expire prescriptions
            var expired = _context.Prescriptions
                .Where(p => p.UserId == userId)
                .Where(p => (p.IsHealthPerscription ?? false) == true)
                .Where(p => p.Approvals.Any())
                .Where(p => p.Approvals.Max(a => a.ApprovalPrescriptionExpiryDate) < today);

            await expired.ExecuteUpdateAsync(setters =>
                setters.SetProperty(p => p.PrescriptionStatusId, PrescriptionStatusConstants.Expired)
            );

            return await _context.Prescriptions
                .Where(p =>
                    p.UserId == userId &&
                    (p.IsHealthPerscription ?? false) == true &&
                    p.PrescriptionStatusId == PrescriptionStatusConstants.Approved &&
                    p.Approvals.Any(a => a.ApprovalPrescriptionExpiryDate >= today)
                )
                // do not show prescriptions that already have an ONGOING plan
                .Where(p => !_context.PrescriptionPlans.Any(pp =>
                    pp.UserId == userId &&
                    pp.PrescriptionPlanStatusId == PrescriptionPlanStatusConstants.Ongoing &&
                    pp.Approval != null &&
                    pp.Approval.PrescriptionId == p.PrescriptionId
                ))
                .Select(p => new PrescriptionPlanEligibleDto
                {
                    PrescriptionId = p.PrescriptionId,
                    PrescriptionName = p.PrescriptionName,
                    ExpiryDate = p.Approvals
                        .Where(a => a.ApprovalPrescriptionExpiryDate != null)
                        .Max(a => a.ApprovalPrescriptionExpiryDate)
                })
                .AsNoTracking()
                .ToListAsync();
        }

        // ===============================
        // PLAN ITEMS (FROM APPROVAL)
        // ===============================
        public async Task<List<PrescriptionPlanItemDto>> GetPlanItemsAsync(int userId, int prescriptionId)
        {
            return await LoadPlanItemsDetailedAsync(userId, prescriptionId);
        }


        public async Task<int?> CreateAsync(int userId, PrescriptionPlanUpsertDto dto)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            // =========================
            // 1) Get valid approval
            // =========================
            var approval = await _context.Approvals
                .Where(a =>
                    a.UserId == userId &&
                    a.PrescriptionId == dto.PrescriptionId &&
                    a.ApprovalPrescriptionExpiryDate >= today
                )
                .OrderByDescending(a => a.ApprovalTimestamp)
                .FirstOrDefaultAsync();

            if (approval == null) return null;

            // =========================
            // 2) Calculate TOTAL AMOUNT
            // =========================
            // You only have ONE approved product per approval
            // Quantity is ApprovalQuantity
            var product = await _context.Products
                .Where(p => p.ProductName == approval.ApprovalProductName)
                .Select(p => new { p.ProductId, Price = (decimal?)p.ProductPrice })
                .FirstOrDefaultAsync();

            if (product == null) return null;

            var quantity = approval.ApprovalQuantity ?? 1;
            var subtotal = (product.Price ?? 0m) * quantity;
            var deliveryFee = dto.Method == "delivery" ? 1m : 0m;
            var totalAmount = subtotal + deliveryFee;

            // =========================
            // 3) Resolve address + branch
            // =========================
            int? addressId = null;
            int? branchId = null;

            if (dto.Method == "pickup")
            {
                branchId = dto.BranchId;
                if (branchId == null) return null;
            }
            else
            {
                // resolve branch from city
                branchId = await _context.Cities
                    .Where(c => c.CityId == dto.CityId)
                    .Select(c => c.BranchId)
                    .FirstOrDefaultAsync();

                if (branchId == null) return null;

                var address = new Address
                {
                    CityId = dto.CityId,
                    Block = dto.Block,
                    Street = dto.Road,
                    BuildingNumber = dto.BuildingFloor,
                    IsProfileAdress = false
                };

                _context.Addresses.Add(address);
                await _context.SaveChangesAsync();

                addressId = address.AddressId;
            }

            // =========================
            // 4) Create Shipping (FULLY)
            // =========================
            var shipping = new Shipping
            {
                UserId = userId,
                BranchId = branchId,
                AddressId = addressId,

                ShippingIsUrgent = false,
                ShippingIsDelivery = dto.Method == "delivery",
                ShippingDate = DateTime.UtcNow
            };

            _context.Shippings.Add(shipping);
            await _context.SaveChangesAsync();

            // =========================
            // 5) Create Prescription Plan
            // =========================
            var plan = new PrescriptionPlan
            {
                UserId = userId,
                ApprovalId = approval.ApprovalId,
                ShippingId = shipping.ShippingId,

                PrescriptionPlanCreationDate = today,
                PrescriptionPlanStatusId = PrescriptionPlanStatusConstants.Ongoing,

                
                PrescriptionPlanTotalAmount = totalAmount
            };

            _context.PrescriptionPlans.Add(plan);
            await _context.SaveChangesAsync();

            var bahrainToday = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3));
            await _emailLogService.SchedulePlanEmailsAsync(
                plan.PrescriptionPlanId,
                userId,
                bahrainToday
            );


            return plan.PrescriptionPlanId;
        }


        public async Task<bool> UpdateAsync(int userId, int planId, PrescriptionPlanUpsertDto dto)
        {
            try
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);

                var plan = await _context.PrescriptionPlans
                    .Include(p => p.Shipping)
                    .Include(p => p.Approval)
                    .FirstOrDefaultAsync(p => p.PrescriptionPlanId == planId && p.UserId == userId);

                if (plan == null || plan.Shipping == null || plan.Approval == null)
                    return false;

                var prescriptionId = plan.Approval.PrescriptionId;

                // ===== 1) Recalculate subtotal =====
                var rows = await (
                    from a in _context.Approvals
                    where a.UserId == userId
                          && a.PrescriptionId == prescriptionId
                          && a.ApprovalPrescriptionExpiryDate >= today
                    join p in _context.Products
                        on a.ApprovalProductName equals p.ProductName into pg
                    from p in pg.DefaultIfEmpty()
                    select new
                    {
                        Qty = (a.ApprovalQuantity ?? 1),
                        Price = (decimal?)(p != null ? p.ProductPrice : null),
                        ProductId = (int?)(p != null ? p.ProductId : null),
                        ProductName = a.ApprovalProductName
                    }
                ).AsNoTracking().ToListAsync();

                if (rows.Count == 0)
                    return false;

                var subtotal = rows.Sum(x => (x.Price ?? 0m) * x.Qty);
                var deliveryFee = dto.Method == "delivery" ? 1m : 0m;
                var newTotal = subtotal + deliveryFee;

                plan.PrescriptionPlanTotalAmount = newTotal;

                var productIds = rows
                    .Where(x => x.ProductId.HasValue)
                    .Select(x => x.ProductId!.Value)
                    .Distinct()
                    .ToList();

                // ===== 2) Update Shipping =====
                var method = (dto.Method ?? "").Trim().ToLowerInvariant();
                if (method != "pickup" && method != "delivery")
                    return false;

                if (method == "pickup")
                {
                    if (dto.BranchId == null || dto.BranchId <= 0)
                        return false;

                    plan.Shipping.BranchId = dto.BranchId.Value;
                    plan.Shipping.AddressId = null;
                    plan.Shipping.ShippingIsDelivery = false;
                    plan.Shipping.ShippingDate = DateTime.UtcNow;
                }
                else // delivery
                {
                    if (dto.CityId == null || dto.CityId <= 0)
                        return false;

                    var assignedBranchId = await _context.Cities
                        .Where(c => c.CityId == dto.CityId.Value)
                        .Select(c => c.BranchId)
                        .FirstOrDefaultAsync();

                    if (assignedBranchId == null)
                        return false;

                    Address address;
                    if (plan.Shipping.AddressId.HasValue)
                    {
                        address = await _context.Addresses
                            .FirstAsync(a => a.AddressId == plan.Shipping.AddressId.Value);
                    }
                    else
                    {
                        address = new Address { IsProfileAdress = false };
                        _context.Addresses.Add(address);
                        await _context.SaveChangesAsync();
                        plan.Shipping.AddressId = address.AddressId;
                    }

                    address.CityId = dto.CityId.Value;
                    address.Block = dto.Block;
                    address.Street = dto.Road;
                    address.BuildingNumber = dto.BuildingFloor;

                    plan.Shipping.BranchId = assignedBranchId.Value;

                    var hasStock = await _shippingRepository.HasStockForAllProductsAsync(
                        assignedBranchId.Value,
                        productIds,
                        ignoreExpired: true
                    );

                    plan.Shipping.ShippingIsDelivery = hasStock;
                    plan.Shipping.ShippingDate = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }





        // ===============================
        // DELETE PLAN
        // ===============================
        public async Task<bool> DeleteAsync(int userId, int planId)
        {
            // Load plan + linked shipping + address
            var plan = await _context.PrescriptionPlans
                .Include(p => p.Shipping)
                .ThenInclude(s => s.Address)
                .FirstOrDefaultAsync(p => p.PrescriptionPlanId == planId && p.UserId == userId);

            if (plan == null) return false;

            var shipping = plan.Shipping;
            var address = shipping?.Address;

            // 1) delete plan first
            _context.PrescriptionPlans.Remove(plan);

            // 2) delete shipping (if exists)
            if (shipping != null)
                _context.Shippings.Remove(shipping);

            // 3) delete address ONLY if it is not a profile address (safe)
            if (address != null && address.IsProfileAdress == false)
                _context.Addresses.Remove(address);

            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<List<PrescriptionPlanListDto>> GetUserPlansAsync(int userId)
        {
            var plans = await _context.PrescriptionPlans
                .Include(p => p.PrescriptionPlanStatus)
                .Include(p => p.Approval).ThenInclude(a => a.Prescription)
                .Include(p => p.Shipping)
                    .ThenInclude(s => s.Branch)
                        .ThenInclude(b => b.Address)
                            .ThenInclude(a => a.City)
                .Include(p => p.Shipping)
                    .ThenInclude(s => s.Address)
                        .ThenInclude(a => a.City)
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.PrescriptionPlanCreationDate)
                .ToListAsync();

            var result = new List<PrescriptionPlanListDto>();

            foreach (var plan in plans)
            {
                var prescriptionId = plan.Approval?.PrescriptionId;

                var items = prescriptionId != null
                    ? await LoadPlanItemsDetailedAsync(userId, prescriptionId.Value)
                    : new List<PrescriptionPlanItemDto>();

                var method = plan.Shipping?.AddressId != null ? "delivery" : "pickup";

                // "branch name" in your UI = CityName from Branch.Address.City
                var pickupCityName = plan.Shipping?.Branch?.Address?.City?.CityName;

                result.Add(new PrescriptionPlanListDto
                {
                    PrescriptionPlanId = plan.PrescriptionPlanId,
                    Name = plan.Approval?.Prescription?.PrescriptionName,
                    Status = plan.PrescriptionPlanStatus?.PrescriptionPlanStatusName,
                    CreationDate = plan.PrescriptionPlanCreationDate?.ToString("yyyy-MM-dd"),
                    Shipping = new ShippingDto
                    {
                        Method = method,

                        // IMPORTANT: send the real BranchId (so edit mode can set <select value>)
                        BranchId = plan.Shipping?.BranchId,

                        PickupBranch = method == "pickup" ? pickupCityName : null,
                        Address = method == "delivery"
                            ? new AddressDto
                            {
                                City = plan.Shipping?.Address?.City?.CityName,
                                Block = plan.Shipping?.Address?.Block,
                                Road = plan.Shipping?.Address?.Street,
                                BuildingFloor = plan.Shipping?.Address?.BuildingNumber
                            }
                            : null
                    },
                    Items = items
                });
            }

            return result;
        }




        public async Task<PrescriptionPlanListDto?> GetPlanDetailsAsync(int planId, int userId)
        {
            var plan = await _context.PrescriptionPlans
                .Include(p => p.PrescriptionPlanStatus)
                .Include(p => p.Approval).ThenInclude(a => a.Prescription)
                .Include(p => p.Shipping)
                    .ThenInclude(s => s.Branch)
                        .ThenInclude(b => b.Address)
                            .ThenInclude(a => a.City)
                .Include(p => p.Shipping)
                    .ThenInclude(s => s.Address)
                        .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(p => p.PrescriptionPlanId == planId && p.UserId == userId);

            if (plan == null) return null;

            var prescriptionId = plan.Approval?.PrescriptionId;

            var items = prescriptionId.HasValue
                ? await LoadPlanItemsDetailedAsync(userId, prescriptionId.Value)
                : new List<PrescriptionPlanItemDto>();

            var method = plan.Shipping?.AddressId != null ? "delivery" : "pickup";

            // "branch name" in your UI = CityName from Branch.Address.City
            var pickupCityName = plan.Shipping?.Branch?.Address?.City?.CityName;

            return new PrescriptionPlanListDto
            {
                PrescriptionPlanId = plan.PrescriptionPlanId,
                Name = plan.Approval?.Prescription?.PrescriptionName,
                Status = plan.PrescriptionPlanStatus?.PrescriptionPlanStatusName,
                CreationDate = plan.PrescriptionPlanCreationDate?.ToString("yyyy-MM-dd"),
                Shipping = new ShippingDto
                {
                    Method = method,

                    // IMPORTANT: send the real BranchId (so edit mode can set <select value>)
                    BranchId = plan.Shipping?.BranchId,

                    PickupBranch = method == "pickup" ? pickupCityName : null,
                    Address = method == "delivery"
                        ? new AddressDto
                        {
                            City = plan.Shipping?.Address?.City?.CityName,
                            Block = plan.Shipping?.Address?.Block,
                            Road = plan.Shipping?.Address?.Street,
                            BuildingFloor = plan.Shipping?.Address?.BuildingNumber
                        }
                        : null
                },
                Items = items
            };
        }




        private async Task<List<PrescriptionPlanItemDto>> LoadPlanItemsDetailedAsync(int userId, int prescriptionId)
        {
            // 1) Load base items (approval + product display fields)
            var items = await (
                from a in _context.Approvals
                where a.UserId == userId && a.PrescriptionId == prescriptionId

                join p in _context.Products
                    on a.ApprovalProductName equals p.ProductName into pg
                from p in pg.DefaultIfEmpty()

                select new PrescriptionPlanItemDto
                {
                    // Approval fields
                    ProductName = a.ApprovalProductName,
                    Dosage = a.ApprovalDosage,
                    Quantity = a.ApprovalQuantity,
                    ExpiryDate = a.ApprovalPrescriptionExpiryDate,

                    // Product fields (safe if p is null)
                    ProductId = p != null ? (int?)p.ProductId : null,
                    Price = p != null ? p.ProductPrice : null,
                    CategoryName = p != null && p.Category != null ? p.Category.CategoryName : null,
                    ProductTypeName = p != null && p.ProductType != null ? p.ProductType.ProductTypeName : null,
                    RequiresPrescription = p != null && (p.IsControlled ?? false),

                    Incompatibilities = null
                }
            )
            .AsNoTracking()
            .ToListAsync();

            // 2) Compute incompatibilities (same structure your UI expects)
            var productIds = items
                .Where(x => x.ProductId.HasValue)
                .Select(x => x.ProductId!.Value)
                .Distinct()
                .ToList();

            if (productIds.Count == 0) return items;

            var illnessMap = await GetIllnessIncompatibilityMapAsync(userId, productIds);
            var allergyMap = await GetAllergyIncompatibilityMapAsync(userId, productIds);

            foreach (var it in items)
            {
                if (!it.ProductId.HasValue)
                {
                    it.Incompatibilities = new
                    {
                        medications = Array.Empty<string>(),
                        allergies = Array.Empty<string>(),
                        illnesses = Array.Empty<string>()
                    };
                    continue;
                }

                illnessMap.TryGetValue(it.ProductId.Value, out var illNames);
                allergyMap.TryGetValue(it.ProductId.Value, out var allNames);

                illNames ??= new List<string>();
                allNames ??= new List<string>();

                it.Incompatibilities = new
                {
                    medications = Array.Empty<string>(),
                    allergies = allNames,
                    illnesses = illNames
                };
            }

            return items;
        }

        private async Task<Dictionary<int, List<string>>> GetIllnessIncompatibilityMapAsync(int userId, List<int> productIds)
        {
            var result = new Dictionary<int, List<string>>();
            if (productIds == null || productIds.Count == 0) return result;

            var hpId = await _context.HealthProfiles
                .Where(h => h.UserId == userId)
                .Select(h => (int?)h.HealthProfileId)
                .FirstOrDefaultAsync();

            if (hpId == null) return result;

            var illnessIds = await _context.HealthProfileIllnesses
                .Where(hpi => hpi.HealthProfileId == hpId.Value)
                .Select(hpi => hpi.IllnessId)
                .Distinct()
                .ToListAsync();

            if (illnessIds.Count == 0) return result;

            var rows = await (
                from ip in _context.IngredientProducts
                join iii in _context.IllnessIngredientInteractions
                    on ip.IngredientId equals iii.IngredientId
                join ill in _context.Illnesses
                    on iii.IllnessId equals ill.IllnessId
                join iname in _context.IllnessNames
                    on ill.IllnessNameId equals iname.IllnessNameId
                where ip.ProductId.HasValue
                      && productIds.Contains(ip.ProductId.Value)
                      && illnessIds.Contains(iii.IllnessId)
                select new
                {
                    ProductId = ip.ProductId.Value,
                    IllnessName = iname.IllnessName1
                }
            )
            .AsNoTracking()
            .ToListAsync();

            foreach (var g in rows.GroupBy(x => x.ProductId))
            {
                result[g.Key] = g
                    .Select(x => x.IllnessName)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct()
                    .OrderBy(x => x)
                    .ToList();
            }

            return result;
        }

        private async Task<Dictionary<int, List<string>>> GetAllergyIncompatibilityMapAsync(int userId, List<int> productIds)
        {
            var result = new Dictionary<int, List<string>>();
            if (productIds == null || productIds.Count == 0) return result;

            var hpId = await _context.HealthProfiles
                .Where(h => h.UserId == userId)
                .Select(h => (int?)h.HealthProfileId)
                .FirstOrDefaultAsync();

            if (hpId == null) return result;

            var allergyIds = await _context.HealthProfileAllergies
                .Where(hpa => hpa.HealthProfileId == hpId.Value)
                .Select(hpa => hpa.AllergyId)
                .Distinct()
                .ToListAsync();

            if (allergyIds.Count == 0) return result;

            var rows = await (
                from ip in _context.IngredientProducts
                join aii in _context.AllergyIngredientInteractions
                    on ip.IngredientId equals aii.IngredientId
                join a in _context.Allergies
                    on aii.AllergyId equals a.AllergyId
                join an in _context.AllergyNames
                    on a.AlleryNameId equals an.AlleryNameId
                where ip.ProductId.HasValue
                      && productIds.Contains(ip.ProductId.Value)
                      && allergyIds.Contains(aii.AllergyId)
                select new
                {
                    ProductId = ip.ProductId.Value,
                    AllergyName = an.AllergyName1
                }
            )
            .AsNoTracking()
            .ToListAsync();

            foreach (var g in rows.GroupBy(x => x.ProductId))
            {
                result[g.Key] = g
                    .Select(x => x.AllergyName)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct()
                    .OrderBy(x => x)
                    .ToList();
            }

            return result;
        }


    }
}
