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

        private const int NORMAL_SLOT_CAPACITY = 9;

        public OrderRepository(QuickPharmaPlusDbContext db)
        {
            _db = db;
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

            // filter: status
            if (statusId.HasValue && statusId.Value > 0)
                q = q.Where(o => o.OrderStatusId == statusId.Value);

            // filter: date range (by creation date)
            if (dateFrom.HasValue)
                q = q.Where(o => o.OrderCreationDate.HasValue && o.OrderCreationDate.Value >= dateFrom.Value);

            if (dateTo.HasValue)
                q = q.Where(o => o.OrderCreationDate.HasValue && o.OrderCreationDate.Value <= dateTo.Value);

            // filter: search (order id)
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();
                if (int.TryParse(search, out var oid))
                    q = q.Where(o => o.OrderId == oid);
                else
                    q = q.Where(o => false); // invalid search => empty (same “safe” behavior as ProductRepository) :contentReference[oaicite:6]{index=6}
            }

            // sorting
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
                    Image = po.Product?.ProductImage != null? Convert.ToBase64String(po.Product.ProductImage) : null,
                    IsControlled = po.Product?.IsControlled
                })
                .ToList();

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

            // Resolve branch depending on mode
            int? resolvedBranchId = null;

            if (req.Mode == "pickup")
            {
                if (!req.PickupBranchId.HasValue)
                    return new ShippingValidationResultDto { Ok = false, Message = "Pickup branch is required." };

                resolvedBranchId = req.PickupBranchId.Value;
            }
            else if (req.Mode == "delivery")
            {
                // For delivery, you said: city -> mapped to branch
                int? cityId = req.CityId;

                if (req.UseSavedAddress)
                {
                    // if using saved address, pull user's profile address city
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

                // scheduling rules
                if (req.IsUrgent == false)
                {
                    if (!req.ShippingDate.HasValue)
                        return new ShippingValidationResultDto { Ok = false, Message = "Shipping date is required." };

                    if (!req.SlotId.HasValue)
                        return new ShippingValidationResultDto { Ok = false, Message = "Time slot is required." };

                    // must be today..today+6
                    var today = GetBahrainToday();
                    if (req.ShippingDate.Value < today || req.ShippingDate.Value > today.AddDays(6))
                        return new ShippingValidationResultDto { Ok = false, Message = "Shipping date must be within the next 6 days." };

                    // if today, slot must not be ended
                    if (req.ShippingDate.Value == today)
                    {
                        var nowTime = GetBahrainNowTime();
                        var slot = await _db.Slots.FirstOrDefaultAsync(s => s.SlotId == req.SlotId.Value);

                        if (slot?.SlotEndTime != null && slot.SlotEndTime.Value <= nowTime)
                            return new ShippingValidationResultDto { Ok = false, Message = "Selected time slot has already ended." };
                    }

                    // capacity check (9 per branch/date/slot)
                    var slotFull = await IsSlotFullAsync(resolvedBranchId.Value, req.ShippingDate.Value, req.SlotId.Value);
                    if (slotFull)
                        return new ShippingValidationResultDto { Ok = false, Message = "Selected slot is full. Please choose another slot." };
                }
            }
            else
            {
                return new ShippingValidationResultDto { Ok = false, Message = "Invalid shipping mode." };
            }

            // Stock validation for resolved branch
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

        // -----------------------------------------
        // 2) Get available slots for next X days
        // -----------------------------------------
        public async Task<List<AvailableSlotsByDateDto>> GetAvailableDeliverySlotsAsync(int branchId, int daysAhead = 6)
        {
            if (daysAhead < 0) daysAhead = 0;
            if (daysAhead > 30) daysAhead = 30;

            var today = GetBahrainToday();
            var nowTime = GetBahrainNowTime();

            // all slots from DB
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
                    // if today, hide slots already ended
                    if (date == today && s.End.HasValue && s.End.Value <= nowTime)
                        continue;

                    // hide full slots (>=9 orders)
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

        // -----------------------------
        // Helpers
        // -----------------------------
        private async Task<bool> IsSlotFullAsync(int branchId, DateOnly date, int slotId)
        {
            // Use Shipping.ShippingDate (DateTime) to compare by date
            var start = date.ToDateTime(TimeOnly.MinValue);
            var end = date.ToDateTime(TimeOnly.MaxValue);

            // NOTE: Shipping is also used by PrescriptionPlans in your schema :contentReference[oaicite:0]{index=0}
            // If you want plans to consume slot capacity too, count them as well.
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

            // Sum inventory per product for that branch; ignore expired
            var inv = await _db.Inventories
                .Where(i =>
                    i.BranchId == branchId &&
                    i.ProductId.HasValue &&
                    productIds.Contains(i.ProductId.Value) &&
                    (
                        !i.InventoryExpiryDate.HasValue ||
                        i.InventoryExpiryDate.Value >= today
                    )
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
