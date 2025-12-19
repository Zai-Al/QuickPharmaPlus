using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Checkout;
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
