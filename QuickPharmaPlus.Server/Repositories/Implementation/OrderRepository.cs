using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Checkout;
using QuickPharmaPlus.Server.ModelsDTO.Order;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class OrderRepository : IOrderRepository
    {
        private readonly QuickPharmaPlusDbContext _db;
        private readonly IIncompatibilityRepository _incompatRepo;

        private const int NORMAL_SLOT_CAPACITY = 9;

        public OrderRepository(QuickPharmaPlusDbContext db, IIncompatibilityRepository incompatRepo)
        {
            _db = db;
            _incompatRepo = incompatRepo;
        }

        public async Task<PagedResult<MyOrderListDto>> GetMyOrdersAsync(
            int userId,
            int pageNumber,
            int pageSize,
            string? search = null,
            int? statusId = null,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            string? sortBy = null)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            var q = _db.Orders
                .AsNoTracking()
                .Where(o => o.UserId == userId)
                .Include(o => o.OrderStatus)
                .Include(o => o.Shipping).ThenInclude(s => s.ShippingSlot)
                .Include(o => o.Payment).ThenInclude(p => p.PaymentMethod)
                .AsQueryable();

            if (statusId.HasValue && statusId.Value > 0)
                q = q.Where(o => o.OrderStatusId == statusId.Value);

            if (dateFrom.HasValue)
                q = q.Where(o => o.OrderCreationDate.HasValue && o.OrderCreationDate.Value >= dateFrom.Value);

            if (dateTo.HasValue)
                q = q.Where(o => o.OrderCreationDate.HasValue && o.OrderCreationDate.Value <= dateTo.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();
                if (int.TryParse(search, out var oid))
                    q = q.Where(o => o.OrderId == oid);
                else
                    q = q.Where(o => false);
            }

            sortBy = (sortBy ?? "").Trim().ToLowerInvariant();
            q = sortBy switch
            {
                "date-asc" => q.OrderBy(o => o.OrderCreationDate),
                "date-desc" => q.OrderByDescending(o => o.OrderCreationDate),
                "total-asc" => q.OrderBy(o => o.OrderTotal),
                "total-desc" => q.OrderByDescending(o => o.OrderTotal),
                _ => q.OrderByDescending(o => o.OrderCreationDate).ThenByDescending(o => o.OrderId),
            };

            var total = await q.CountAsync();

            var items = await q
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new MyOrderListDto
                {
                    OrderId = o.OrderId,
                    OrderCreationDate = o.OrderCreationDate,
                    OrderTotal = o.OrderTotal,
                    OrderStatusId = o.OrderStatusId,
                    OrderStatusName = o.OrderStatus != null ? o.OrderStatus.OrderStatusName : null,

                    IsDelivery = o.Shipping != null ? o.Shipping.ShippingIsDelivery : null,
                    ShippingDate = o.Shipping != null ? o.Shipping.ShippingDate : null,

                    SlotId = o.Shipping != null ? o.Shipping.ShippingSlotId : null,
                    SlotName = (o.Shipping != null && o.Shipping.ShippingSlot != null) ? o.Shipping.ShippingSlot.SlotName : null,

                    PaymentMethodName = (o.Payment != null && o.Payment.PaymentMethod != null) ? o.Payment.PaymentMethod.PaymentMethodName : null
                })
                .ToListAsync();

            return new PagedResult<MyOrderListDto> { Items = items, TotalCount = total };
        }

        public async Task<MyOrderDetailsDto?> GetMyOrderDetailsAsync(int userId, int orderId)
        {
            var o = await _db.Orders
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.OrderId == orderId)
                .Include(x => x.OrderStatus)
                .Include(x => x.Shipping).ThenInclude(s => s.ShippingSlot)
                .Include(x => x.Shipping).ThenInclude(s => s.Branch).ThenInclude(b => b.Address).ThenInclude(a => a.City)
                .Include(x => x.Payment).ThenInclude(p => p.PaymentMethod)
                .Include(x => x.ProductOrders).ThenInclude(po => po.Product).ThenInclude(p => p.Category)
                .Include(x => x.ProductOrders).ThenInclude(po => po.Product).ThenInclude(p => p.ProductType)
                .FirstOrDefaultAsync();

            if (o == null) return null;

            var dto = new MyOrderDetailsDto
            {
                OrderId = o.OrderId,
                OrderCreationDate = o.OrderCreationDate,
                OrderTotal = o.OrderTotal,
                OrderStatusId = o.OrderStatusId,
                OrderStatusName = o.OrderStatus?.OrderStatusName,

                IsDelivery = o.Shipping?.ShippingIsDelivery,
                IsUrgent = o.Shipping?.ShippingIsUrgent,
                ShippingDate = o.Shipping?.ShippingDate,

                SlotId = o.Shipping?.ShippingSlotId,
                SlotName = o.Shipping?.ShippingSlot?.SlotName,
                SlotStart = o.Shipping?.ShippingSlot?.SlotStartTime,
                SlotEnd = o.Shipping?.ShippingSlot?.SlotEndTime,

                BranchId = o.Shipping?.BranchId,
                BranchName = o.Shipping?.Branch?.Address?.City?.CityName,

                PaymentMethodName = o.Payment?.PaymentMethod?.PaymentMethodName,
            };

            dto.Items = o.ProductOrders
                .Select(po => new MyOrderItemDto
                {
                    ProductId = po.Product?.ProductId ?? 0,
                    ProductName = po.Product?.ProductName,
                    CategoryName = po.Product?.Category?.CategoryName,
                    ProductTypeName = po.Product?.ProductType?.ProductTypeName,
                    Price = po.Product?.ProductPrice,
                    Quantity = po.Quantity,
                    Image = po.Product?.ProductImage != null ? Convert.ToBase64String(po.Product.ProductImage) : null,
                    IsControlled = po.Product?.IsControlled,
                    IsPrescribed = (po.Product != null && po.Product.CategoryId == 1),

                    // will fill after
                    Incompatibilities = null
                })
                .ToList();

            // attach incompatibilities
            var productIds = dto.Items
                .Where(i => i.ProductId > 0)
                .Select(i => i.ProductId)
                .Distinct()
                .ToList();

            if (productIds.Count > 0)
            {
                var incMap = await _incompatRepo.GetMapAsync(userId, productIds);

                foreach (var it in dto.Items)
                {
                    if (it.ProductId > 0 && incMap.TryGetValue(it.ProductId, out var inc))
                    {
                        // keep same shape as external products if your UI expects keys:
                        it.Incompatibilities = new
                        {
                            medications = inc.Medications,
                            allergies = inc.Allergies,
                            illnesses = inc.Illnesses
                        };

                        // Or set DTO directly:
                        // it.Incompatibilities = inc;
                    }
                }
            }

            return dto;
        }

        // -----------------------------
        // 1) Validate shipping + stock
        // -----------------------------
        public async Task<ShippingValidationResultDto> ValidateShippingAsync(CheckoutShippingRequestDto req)
        {
            if (req.Items == null || req.Items.Count == 0)
            {
                return new ShippingValidationResultDto
                {
                    Ok = false,
                    Message = "No items provided."
                };
            }

            int? resolvedBranchId = null;

            if (req.Mode == "pickup")
            {
                if (!req.PickupBranchId.HasValue)
                    return new ShippingValidationResultDto { Ok = false, Message = "Pickup branch is required." };

                resolvedBranchId = req.PickupBranchId.Value;
            }
            else if (req.Mode == "delivery")
            {
                int? cityId = req.CityId;

                if (req.UseSavedAddress)
                {
                    var userCity = await _db.Users
                        .Include(u => u.Address)
                        .Where(u => u.UserId == req.UserId)
                        .Select(u => u.Address!.CityId)
                        .FirstOrDefaultAsync();

                    cityId = userCity;
                }

                if (!cityId.HasValue)
                    return new ShippingValidationResultDto { Ok = false, Message = "City is required for delivery." };

                resolvedBranchId = await _db.Cities
                    .Where(c => c.CityId == cityId.Value)
                    .Select(c => c.BranchId)
                    .FirstOrDefaultAsync();

                if (!resolvedBranchId.HasValue)
                    return new ShippingValidationResultDto { Ok = false, Message = "No branch mapped to this city." };

                if (req.IsUrgent == false)
                {
                    if (!req.ShippingDate.HasValue)
                        return new ShippingValidationResultDto { Ok = false, Message = "Shipping date is required." };

                    if (!req.SlotId.HasValue)
                        return new ShippingValidationResultDto { Ok = false, Message = "Time slot is required." };

                    var today = GetBahrainToday();
                    if (req.ShippingDate.Value < today || req.ShippingDate.Value > today.AddDays(6))
                        return new ShippingValidationResultDto { Ok = false, Message = "Shipping date must be within the next 6 days." };

                    if (req.ShippingDate.Value == today)
                    {
                        var nowTime = GetBahrainNowTime();
                        var slot = await _db.Slots.FirstOrDefaultAsync(s => s.SlotId == req.SlotId.Value);

                        if (slot?.SlotEndTime != null && slot.SlotEndTime.Value <= nowTime)
                            return new ShippingValidationResultDto { Ok = false, Message = "Selected time slot has already ended." };
                    }

                    var slotFull = await IsSlotFullAsync(resolvedBranchId.Value, req.ShippingDate.Value, req.SlotId.Value);
                    if (slotFull)
                        return new ShippingValidationResultDto { Ok = false, Message = "Selected slot is full. Please choose another slot." };
                }
            }
            else
            {
                return new ShippingValidationResultDto { Ok = false, Message = "Invalid shipping mode." };
            }

            var unavailableNames = await GetUnavailableProductNamesAsync(resolvedBranchId.Value, req.Items);

            return new ShippingValidationResultDto
            {
                Ok = unavailableNames.Count == 0,
                BranchId = resolvedBranchId,
                UnavailableProductNames = unavailableNames,
                Message = unavailableNames.Count == 0
                    ? "OK"
                    : "Some items are not available in the selected/assigned branch."
            };
        }

        public async Task<List<AvailableSlotsByDateDto>> GetAvailableDeliverySlotsAsync(int branchId, int daysAhead = 6)
        {
            if (daysAhead < 0) daysAhead = 0;
            if (daysAhead > 30) daysAhead = 30;

            var today = GetBahrainToday();
            var nowTime = GetBahrainNowTime();

            var allSlots = await _db.Slots
                .OrderBy(s => s.SlotStartTime)
                .Select(s => new AvailableSlotDto
                {
                    SlotId = s.SlotId,
                    SlotName = s.SlotName,
                    Start = s.SlotStartTime,
                    End = s.SlotEndTime,
                    Description = s.SlotDescription
                })
                .ToListAsync();

            var results = new List<AvailableSlotsByDateDto>();

            for (int d = 0; d <= daysAhead; d++)
            {
                var date = today.AddDays(d);
                var available = new List<AvailableSlotDto>();

                foreach (var s in allSlots)
                {
                    if (date == today && s.End.HasValue && s.End.Value <= nowTime)
                        continue;

                    var full = await IsSlotFullAsync(branchId, date, s.SlotId);
                    if (full) continue;

                    available.Add(s);
                }

                results.Add(new AvailableSlotsByDateDto
                {
                    Date = date,
                    Slots = available
                });
            }

            return results;
        }

        public async Task<OrderRescheduleOptionsDto?> GetRescheduleOptionsAsync(int userId, int orderId)
        {
            var o = await _db.Orders
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.OrderId == orderId)
                .Include(x => x.Shipping).ThenInclude(s => s.ShippingSlot)
                .FirstOrDefaultAsync();

            if (o == null) return null;

            if (o.OrderStatusId != 1) return null;
            if (o.Shipping?.ShippingIsDelivery != true) return null;
            if (o.Shipping?.ShippingIsUrgent == true) return null;

            if (!o.OrderCreationDate.HasValue) return null;
            if (!o.Shipping?.BranchId.HasValue ?? true) return null;

            var created = DateOnly.FromDateTime(o.OrderCreationDate.Value);
            var min = GetBahrainToday();
            if (min < created) min = created;

            var max = created.AddDays(6);
            if (min > max) return new OrderRescheduleOptionsDto { MinDate = min, MaxDate = max, Days = new() };

            var nowTime = GetBahrainNowTime();
            var branchId = o.Shipping!.BranchId!.Value;

            var allSlots = await _db.Slots
                .OrderBy(s => s.SlotStartTime)
                .Select(s => new AvailableSlotDto
                {
                    SlotId = s.SlotId,
                    SlotName = s.SlotName,
                    Start = s.SlotStartTime,
                    End = s.SlotEndTime,
                    Description = s.SlotDescription
                })
                .ToListAsync();

            var days = new List<AvailableSlotsByDateDto>();
            for (var d = min; d <= max; d = d.AddDays(1))
            {
                var available = new List<AvailableSlotDto>();

                foreach (var s in allSlots)
                {
                    if (d == GetBahrainToday() && s.End.HasValue && s.End.Value <= nowTime)
                        continue;

                    var full = await IsSlotFullAsync(branchId, d, s.SlotId);
                    if (full) continue;

                    available.Add(s);
                }

                days.Add(new AvailableSlotsByDateDto { Date = d, Slots = available });
            }

            return new OrderRescheduleOptionsDto
            {
                MinDate = min,
                MaxDate = max,
                Days = days
            };
        }

        public async Task<bool> RescheduleDeliveryAsync(int userId, int orderId, DateOnly shippingDate, int slotId)
        {
            var o = await _db.Orders
                .Where(x => x.UserId == userId && x.OrderId == orderId)
                .Include(x => x.Shipping)
                .FirstOrDefaultAsync();

            if (o == null) return false;

            if (o.OrderStatusId != 1) return false;
            if (o.Shipping?.ShippingIsDelivery != true) return false;
            if (o.Shipping?.ShippingIsUrgent == true) return false;
            if (!o.OrderCreationDate.HasValue) return false;
            if (!o.Shipping?.BranchId.HasValue ?? true) return false;

            var created = DateOnly.FromDateTime(o.OrderCreationDate.Value);
            var min = GetBahrainToday();
            if (min < created) min = created;

            var max = created.AddDays(6);
            if (shippingDate < min || shippingDate > max) return false;

            if (shippingDate == GetBahrainToday())
            {
                var nowTime = GetBahrainNowTime();
                var slot = await _db.Slots.FirstOrDefaultAsync(s => s.SlotId == slotId);
                if (slot?.SlotEndTime != null && slot.SlotEndTime.Value <= nowTime) return false;
            }

            var branchId = o.Shipping!.BranchId!.Value;
            var full = await IsSlotFullAsync(branchId, shippingDate, slotId);
            if (full) return false;

            o.Shipping!.ShippingDate = shippingDate.ToDateTime(TimeOnly.MinValue);
            o.Shipping!.ShippingSlotId = slotId;

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<UrgentAvailabilityDto> GetUrgentAvailabilityAsync(int branchId)
        {
            if (branchId <= 0)
                return new UrgentAvailabilityDto { Available = false, Reason = "Invalid branch." };

            var now = DateTime.Now; // Bahrain server time in your repo helpers
            var target = TimeOnly.FromDateTime(now.AddHours(1));
            var nowT = TimeOnly.FromDateTime(now);

            // crossed midnight -> no urgent
            if (target < nowT)
                return new UrgentAvailabilityDto { Available = false, Reason = "Urgent is not available at this time." };

            // RULE:
            // 1) if any slot starts EXACTLY at target => pick it
            // 2) else pick slot that CONTAINS target (start < target < end)
            var slotId = await _db.Slots
                .AsNoTracking()
                .Where(s =>
                    (s.SlotStartTime.HasValue && s.SlotStartTime.Value == target) ||
                    (s.SlotStartTime.HasValue && s.SlotEndTime.HasValue &&
                     s.SlotStartTime.Value < target && s.SlotEndTime.Value > target)
                )
                .OrderByDescending(s => s.SlotStartTime.HasValue && s.SlotStartTime.Value == target) // prefer exact start match
                .ThenBy(s => s.SlotStartTime)
                .Select(s => (int?)s.SlotId)
                .FirstOrDefaultAsync();

            if (!slotId.HasValue)
                return new UrgentAvailabilityDto { Available = false, Reason = "No slot is available for the next hour." };

            // ONLY 1 urgent per (branch + slot + today)
            var start = DateOnly.FromDateTime(now).ToDateTime(TimeOnly.MinValue);
            var end = DateOnly.FromDateTime(now).ToDateTime(TimeOnly.MaxValue);

            var taken = await _db.Shippings
                .AsNoTracking()
                .Where(sh =>
                    sh.BranchId == branchId &&
                    sh.ShippingIsDelivery == true &&
                    sh.ShippingIsUrgent == true &&
                    sh.ShippingSlotId == slotId.Value &&
                    sh.ShippingDate.HasValue &&
                    sh.ShippingDate.Value >= start &&
                    sh.ShippingDate.Value <= end
                )
                .AnyAsync();

            if (taken)
                return new UrgentAvailabilityDto { Available = false, SlotId = slotId, Reason = "Urgent is already taken for this time slot." };

            return new UrgentAvailabilityDto { Available = true, SlotId = slotId, Reason = "" };
        }

        // -----------------------------
        // Helpers
        // -----------------------------
        private async Task<bool> IsSlotFullAsync(int branchId, DateOnly date, int slotId)
        {
            var start = date.ToDateTime(TimeOnly.MinValue);
            var end = date.ToDateTime(TimeOnly.MaxValue);

            var used = await _db.Shippings
                .Where(sh =>
                    sh.BranchId == branchId &&
                    sh.ShippingIsDelivery == true &&
                    (sh.ShippingIsUrgent == false || sh.ShippingIsUrgent == null) &&
                    sh.ShippingSlotId == slotId &&
                    sh.ShippingDate.HasValue &&
                    sh.ShippingDate.Value >= start &&
                    sh.ShippingDate.Value <= end
                )
                .CountAsync();

            return used >= NORMAL_SLOT_CAPACITY;
        }

        private async Task<List<string>> GetUnavailableProductNamesAsync(int branchId, List<CheckoutCartItemDto> items)
        {
            var today = GetBahrainToday();

            var productIds = items.Select(i => i.ProductId).Distinct().ToList();

            var inv = await _db.Inventories
                .Where(i =>
                    i.BranchId == branchId &&
                    i.ProductId.HasValue &&
                    productIds.Contains(i.ProductId.Value) &&
                    (!i.InventoryExpiryDate.HasValue || i.InventoryExpiryDate.Value >= today)
                )
                .GroupBy(i => i.ProductId!.Value)
                .Select(g => new
                {
                    ProductId = g.Key,
                    Qty = g.Sum(x => x.InventoryQuantity ?? 0)
                })
                .ToListAsync();

            var invMap = inv.ToDictionary(x => x.ProductId, x => x.Qty);

            var insufficientIds = items
                .Where(it =>
                {
                    invMap.TryGetValue(it.ProductId, out var available);
                    return available < it.Quantity;
                })
                .Select(it => it.ProductId)
                .Distinct()
                .ToList();

            if (insufficientIds.Count == 0) return new List<string>();

            var names = await _db.Products
                .Where(p => insufficientIds.Contains(p.ProductId))
                .Select(p => p.ProductName ?? ("Product #" + p.ProductId))
                .ToListAsync();

            return names;
        }

        private static DateOnly GetBahrainToday()
        {
            return DateOnly.FromDateTime(DateTime.Now);
        }

        private static TimeOnly GetBahrainNowTime()
        {
            return TimeOnly.FromDateTime(DateTime.Now);
        }
    }
}
