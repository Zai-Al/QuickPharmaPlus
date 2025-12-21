using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.UI.Services;
using QuickPharmaPlus.Server.Models;

namespace QuickPharmaPlus.Server.Services
{
    public interface IOrderEmailService
    {
        Task TrySendOrderCreatedEmailAsync(int orderId, int userId, CancellationToken ct = default);
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

        public async Task TrySendOrderCreatedEmailAsync(int orderId, int userId, CancellationToken ct = default)
        {
            // Load order + user + shipping + items
            var order = await _db.Orders
                .Include(o => o.User)
                .Include(o => o.Shipping)
                    .ThenInclude(s => s.Branch)
                        .ThenInclude(b => b.Address)
                            .ThenInclude(a => a.City)
                .Include(o => o.Payment)
                    .ThenInclude(p => p.PaymentMethod)
                .Include(o => o.Shipping)
                    .ThenInclude(s => s.Address)
                        .ThenInclude(a => a.City)
                .Include(o => o.ProductOrders)
                    .ThenInclude(po => po.Product)
                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId, ct);

            if (order == null) return;

            var user = order.User;
            if (user == null || string.IsNullOrWhiteSpace(user.EmailAddress)) return;

            var paymentMethod =
    order.Payment?.PaymentMethod?.PaymentMethodName
    ?? (order.Payment?.PaymentMethodId == 1 ? "Cash" : null)   // optional fallback
    ?? "—";


            // Build labels
            var isDelivery = order.Shipping?.ShippingIsDelivery == true;
            var methodLabel = isDelivery ? "Delivery" : "Pickup";

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

            // Items summary (safe)
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

            var subject = $"QuickPharmaPlus – Order Confirmed (#{order.OrderId})";

            var body = $@"
                <div style='font-family:Arial,sans-serif; line-height:1.6'>
                  <h2 style='margin:0 0 8px 0'>Order Confirmed ✅</h2>
                  <p style='margin:0 0 12px 0'>Hi {System.Net.WebUtility.HtmlEncode(user.FirstName ?? "Customer")},</p>

                  <p style='margin:0 0 12px 0'>
                    Your order <b>#{order.OrderId}</b> has been created successfully on <b>{bahrainNow:yyyy-MM-dd HH:mm}</b>.
                  </p>

                  <div style='margin:12px 0; padding:12px; border:1px solid #ddd; border-radius:8px'>
                    <p style='margin:0 0 6px 0'><b>Method:</b> {methodLabel}</p>
                    <p style='margin:0 0 6px 0'><b>Location:</b> {System.Net.WebUtility.HtmlEncode(locationLabel)}</p>
                    <p><b>Payment method:</b> {paymentMethod}</p>
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
