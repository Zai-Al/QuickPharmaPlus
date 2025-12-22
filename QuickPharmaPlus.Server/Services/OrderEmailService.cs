using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;

namespace QuickPharmaPlus.Server.Services
{
    public interface IOrderEmailService
    {
        Task TrySendOrderCreatedEmailAsync(int orderId, int userId, CancellationToken ct = default);
        Task TrySendOrderRescheduledEmailAsync(int orderId, int userId, CancellationToken ct = default);
    }

    public class OrderEmailService : IOrderEmailService
    {
        private readonly QuickPharmaPlusDbContext _db;
        private readonly IEmailSender _emailSender;

        public OrderEmailService(QuickPharmaPlusDbContext db, IEmailSender emailSender)
        {
            _db = db;
            _emailSender = emailSender;
        }

        public Task TrySendOrderCreatedEmailAsync(int orderId, int userId, CancellationToken ct = default)
        {
            return SendOrderEmailAsync(
                orderId,
                userId,
                headerTitle: "Order Confirmed ✅",
                actionLine: "has been created successfully",
                subjectPrefix: "Order Confirmed",
                ct
            );
        }

        public Task TrySendOrderRescheduledEmailAsync(int orderId, int userId, CancellationToken ct = default)
        {
            return SendOrderEmailAsync(
                orderId,
                userId,
                headerTitle: "Order Rescheduled ✅",
                actionLine: "has been rescheduled successfully",
                subjectPrefix: "Order Rescheduled",
                ct
            );
        }

        private async Task SendOrderEmailAsync(
            int orderId,
            int userId,
            string headerTitle,
            string actionLine,
            string subjectPrefix,
            CancellationToken ct
        )
        {
            // Load order + user + shipping + slot + items
            var order = await _db.Orders
                .Include(o => o.User)
                .Include(o => o.Shipping)
                    .ThenInclude(s => s.ShippingSlot) // IMPORTANT: for time range
                .Include(o => o.Shipping)
                    .ThenInclude(s => s.Branch)
                        .ThenInclude(b => b.Address)
                            .ThenInclude(a => a.City)
                .Include(o => o.Shipping)
                    .ThenInclude(s => s.Address)
                        .ThenInclude(a => a.City)
                .Include(o => o.Payment)
                    .ThenInclude(p => p.PaymentMethod)
                .Include(o => o.ProductOrders)
                    .ThenInclude(po => po.Product)
                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId, ct);

            if (order == null) return;

            var user = order.User;
            if (user == null || string.IsNullOrWhiteSpace(user.EmailAddress)) return;

            var paymentMethod =
                order.Payment?.PaymentMethod?.PaymentMethodName
                ?? (order.Payment?.PaymentMethodId == 1 ? "Cash" : null)
                ?? "—";

            // Labels
            var isDelivery = order.Shipping?.ShippingIsDelivery == true;
            var methodLabel = isDelivery ? "Delivery" : "Pickup";

            // Location
            string locationLabel;
            if (isDelivery)
            {
                var addr = order.Shipping?.Address;
                var city = addr?.City?.CityName;
                locationLabel =
                    $"{city ?? "City"} - Block {addr?.Block ?? "—"}, Road {addr?.Street ?? "—"}, Building {addr?.BuildingNumber ?? "—"}";
            }
            else
            {
                var pickupCity = order.Shipping?.Branch?.Address?.City?.CityName;
                locationLabel = pickupCity ?? "Pickup branch";
            }

            // Delivery time (ONLY if delivery)
            string? deliveryTimeLabel = null;
            if (isDelivery)
            {
                // date
                var shipDate = order.Shipping?.ShippingDate;
                var slot = order.Shipping?.ShippingSlot;

                // slot time range
                var start = slot?.SlotStartTime;
                var end = slot?.SlotEndTime;

                var datePart = shipDate.HasValue ? shipDate.Value.ToString("yyyy-MM-dd") : "—";
                string timePart = "—";

                if (start.HasValue && end.HasValue)
                {
                    timePart = $"{start.Value:HH\\:mm} - {end.Value:HH\\:mm}";
                }
                else if (!string.IsNullOrWhiteSpace(slot?.SlotName))
                {
                    timePart = slot!.SlotName!;
                }

                deliveryTimeLabel = $"{datePart} ({timePart})";
            }

            // Items summary
            var items = (order.ProductOrders ?? new List<ProductOrder>())
                .Select(po =>
                {
                    var name = po.Product?.ProductName ?? "Item";
                    var qty = po.Quantity;
                    var price = (decimal?)(po.Product?.ProductPrice) ?? 0m;
                    return new { name, qty, price };
                })
                .ToList();

            var itemsHtml = string.Join("", items.Select(i =>
                $"<li>{System.Net.WebUtility.HtmlEncode(i.name)} × {i.qty} — {i.price:0.000} BHD</li>"
            ));

            var total = order.OrderTotal ?? 0m;

            // Bahrain time display (UTC+3)
            var bahrainNow = DateTime.UtcNow.AddHours(3);

            var subject = $"QuickPharmaPlus – {subjectPrefix} (#{order.OrderId})";

            var deliveryTimeHtml = (isDelivery && !string.IsNullOrWhiteSpace(deliveryTimeLabel))
                ? $"<p style='margin:0 0 6px 0'><b>Delivery time:</b> {System.Net.WebUtility.HtmlEncode(deliveryTimeLabel)}</p>"
                : "";

            var body = $@"
                <div style='font-family:Arial,sans-serif; line-height:1.6'>
                  <h2 style='margin:0 0 8px 0'>{headerTitle}</h2>
                  <p style='margin:0 0 12px 0'>Hi {System.Net.WebUtility.HtmlEncode(user.FirstName ?? "Customer")},</p>

                  <p style='margin:0 0 12px 0'>
                    Your order <b>#{order.OrderId}</b> {actionLine} on <b>{bahrainNow:yyyy-MM-dd HH:mm}</b>.
                  </p>

                  <div style='margin:12px 0; padding:12px; border:1px solid #ddd; border-radius:8px'>
                    <p style='margin:0 0 6px 0'><b>Method:</b> {methodLabel}</p>
                    <p style='margin:0 0 6px 0'><b>Location:</b> {System.Net.WebUtility.HtmlEncode(locationLabel)}</p>
                    {deliveryTimeHtml}
                    <p style='margin:0 0 6px 0'><b>Payment method:</b> {System.Net.WebUtility.HtmlEncode(paymentMethod)}</p>
                    <p style='margin:0'><b>Total:</b> {total:0.000} BHD</p>
                  </div>

                  <p style='margin:12px 0 6px 0'><b>Items:</b></p>
                  <ul style='margin:0 0 12px 20px; padding:0'>
                    {itemsHtml}
                  </ul>

                  <p style='margin:0'>Thank you for using QuickPharmaPlus.</p>
                </div>";

            await _emailSender.SendEmailAsync(user.EmailAddress!, subject, body);
        }
    }
}
