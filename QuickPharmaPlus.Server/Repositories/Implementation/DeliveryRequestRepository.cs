using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Delivery;
using QuickPharmaPlus.Server.Repositories.Interface;
using QuickPharmaPlus.Server.Services;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class DeliveryRequestRepository : IDeliveryRequestRepository
    {
        private readonly QuickPharmaPlusDbContext _db;
        private readonly IQuickPharmaLogRepository _logger;
        private readonly IDeliveryNotificationEmailService _deliveryEmail;

        public DeliveryRequestRepository(
            QuickPharmaPlusDbContext db,
            IQuickPharmaLogRepository logger,
            IDeliveryNotificationEmailService deliveryEmail)
        {
            _db = db;
            _logger = logger;
            _deliveryEmail = deliveryEmail;
        }

        public async Task<DeliveryRequestsPagedResultDto> GetDeliveryRequestsAsync(
            string identityUserId,
            bool isAdmin,
            int pageNumber,
            int pageSize,
            int? orderId = null,
            int? statusId = null,
            int? paymentMethodId = null,
            bool? isUrgent = null)
        {
            int? branchId = null;
            int? slotId = null;

            if (!isAdmin)
            {
                var driver = await _db.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.IdentityUserId == identityUserId);

                if (driver == null || !driver.BranchId.HasValue || !driver.SlotId.HasValue)
                {
                    return new DeliveryRequestsPagedResultDto
                    {
                        Items = new(),
                        TotalCount = 0,
                        PageNumber = pageNumber,
                        PageSize = pageSize
                    };
                }

                branchId = driver.BranchId.Value;
                slotId = driver.SlotId.Value;
            }

            var query =
                from s in _db.Shippings.AsNoTracking()
                where s.ShippingIsDelivery == true
                from o in s.Orders.DefaultIfEmpty()
                select new { s, o };

            if (!isAdmin)
            {
                query = query.Where(x =>
                    x.s.BranchId == branchId &&
                    x.s.ShippingSlotId == slotId);
            }

            if (orderId.HasValue && orderId.Value > 0)
                query = query.Where(x => x.o != null && x.o.OrderId == orderId.Value);

            // NEW: status filter
            if (statusId.HasValue && statusId.Value > 0)
                query = query.Where(x => x.o != null && x.o.OrderStatusId == statusId.Value);

            // NEW: payment method filter
            if (paymentMethodId.HasValue && paymentMethodId.Value > 0)
                query = query.Where(x => x.o != null && x.o.Payment != null && x.o.Payment.PaymentMethodId == paymentMethodId.Value);

            // NEW: urgency filter
            if (isUrgent.HasValue)
                query = query.Where(x => (x.s.ShippingIsUrgent == true) == isUrgent.Value);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.s.ShippingIsUrgent == true)
                .ThenByDescending(x => x.o != null ? x.o.OrderId : 0)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new DeliveryRequestListItemDto
                {
                    ShippingId = x.s.ShippingId,
                    OrderId = x.o != null ? x.o.OrderId : 0,
                    Location = x.s.Address == null
                        ? "—"
                        : ((x.s.Address.City != null ? x.s.Address.City.CityName + ", " : "") +
                           "Block " + (x.s.Address.Block ?? "") + ", " +
                           "Road " + (x.s.Address.Street ?? "") + ", " +
                           "Building " + (x.s.Address.BuildingNumber ?? "")),
                    PaymentMethod = x.o != null && x.o.Payment != null && x.o.Payment.PaymentMethod != null
                        ? (x.o.Payment.PaymentMethod.PaymentMethodName ?? "—")
                        : "—",
                    IsPaymentSuccessful = x.o != null && x.o.Payment != null && x.o.Payment.PaymentIsSuccessful == true,
                    SlotName = x.s.ShippingSlot != null ? (x.s.ShippingSlot.SlotName ?? "—") : "—",
                    IsUrgent = x.s.ShippingIsUrgent == true,
                    OrderStatusId = x.o != null && x.o.OrderStatusId.HasValue ? x.o.OrderStatusId.Value : 0,
                    OrderStatusName = x.o != null && x.o.OrderStatus != null
                        ? (x.o.OrderStatus.OrderStatusName ?? "Unknown")
                        : "Unknown",
                    CustomerUserId = x.s.UserId ?? 0,
                    CustomerName = x.s.User != null ? (($"{x.s.User.FirstName} {x.s.User.LastName}").Trim()) : "—",
                    CustomerPhone = x.s.User != null ? (x.s.User.ContactNumber ?? "—") : "—",
                    CustomerEmail = x.s.User != null ? (x.s.User.EmailAddress ?? "—") : "—",
                })
                .ToListAsync();

            return new DeliveryRequestsPagedResultDto
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<bool> UpdateDeliveryStatusAsync(
            string identityUserId,
            bool isAdmin,
            int orderId,
            UpdateDeliveryStatusRequestDto dto,
            CancellationToken ct = default)
        {
            if (dto.NewStatusId is not (1 or 2 or 3))
                return false;

            var driver = await _db.Users
                .FirstOrDefaultAsync(u => u.IdentityUserId == identityUserId, ct);

            if (driver == null)
                return false;

            // Load order with required relations
            var order = await _db.Orders
                .Include(o => o.Shipping)
                .Include(o => o.Payment)
                    .ThenInclude(p => p.PaymentMethod)
                .FirstOrDefaultAsync(o => o.OrderId == orderId, ct);

            if (order == null || order.Shipping == null)
                return false;

            // For drivers: enforce branch+slot isolation
            if (!isAdmin)
            {
                if (!driver.BranchId.HasValue || !driver.SlotId.HasValue)
                    return false;

                if (order.Shipping.BranchId != driver.BranchId.Value ||
                    order.Shipping.ShippingSlotId != driver.SlotId.Value)
                    return false;
            }

            var oldStatusId = order.OrderStatusId ?? 0;
            order.OrderStatusId = dto.NewStatusId;

            await _db.SaveChangesAsync(ct);

            // Log order status update
            try
            {
                await _logger.CreateEditRecordLogAsync(
                    userId: driver.UserId,
                    tableName: "Order",
                    recordId: order.OrderId,
                    details: $"Order status changed: {oldStatusId} -> {dto.NewStatusId}");
            }
            catch
            {
                // ignore logging failures
            }

            // If status = Out for Delivery (2) -> send email
            if (dto.NewStatusId == 2)
            {
                var customerUserId = order.Shipping.UserId ?? order.UserId ?? 0;
                await _deliveryEmail.TrySendOutForDeliveryAsync(order.OrderId, customerUserId, driver.UserId, ct);
            }

            // If status = Completed (3) -> optionally set payment successful if cash
            if (dto.NewStatusId == 3)
            {
                var payment = order.Payment;
                var paymentMethodName = payment?.PaymentMethod?.PaymentMethodName ?? "";

                var isCash =
                    paymentMethodName.Equals("Cash", StringComparison.OrdinalIgnoreCase) ||
                    paymentMethodName.Equals("Pay on Delivery", StringComparison.OrdinalIgnoreCase);

                if (payment != null && isCash && dto.MarkCashPaymentSuccessful)
                {
                    var oldPaid = payment.PaymentIsSuccessful == true;

                    payment.PaymentIsSuccessful = true;
                    payment.PaymentTimestamp = DateTime.UtcNow;

                    await _db.SaveChangesAsync(ct);

                    try
                    {
                        await _logger.CreateEditRecordLogAsync(
                            userId: driver.UserId,
                            tableName: "Payment",
                            recordId: payment.PaymentId,
                            details: $"Payment marked successful (cash). Previous: {oldPaid}");
                    }
                    catch
                    {
                        // ignore logging failures
                    }
                }

                var customerUserId = order.Shipping.UserId ?? order.UserId ?? 0;
                await _deliveryEmail.TrySendDeliveredAsync(order.OrderId, customerUserId, driver.UserId, ct);
            }

            return true;
        }
    }
}