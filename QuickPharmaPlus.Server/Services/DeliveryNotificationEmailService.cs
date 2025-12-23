using System.Net;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;

namespace QuickPharmaPlus.Server.Services
{
    public interface IDeliveryNotificationEmailService
    {
        Task TrySendOutForDeliveryAsync(int orderId, int customerUserId, int driverUserId, CancellationToken ct = default);
        Task TrySendDeliveredAsync(int orderId, int customerUserId, int driverUserId, CancellationToken ct = default);
    }

    public class DeliveryNotificationEmailService : IDeliveryNotificationEmailService
    {
        private readonly QuickPharmaPlusDbContext _db;
        private readonly IEmailSender _emailSender;

        public DeliveryNotificationEmailService(QuickPharmaPlusDbContext db, IEmailSender emailSender)
        {
            _db = db;
            _emailSender = emailSender;
        }

        public Task TrySendOutForDeliveryAsync(int orderId, int customerUserId, int driverUserId, CancellationToken ct = default)
        {
            return SendAsync(
                orderId,
                customerUserId,
                driverUserId,
                subject: $"QuickPharmaPlus – Out for Delivery (#{orderId})",
                headerTitle: "Your Order is Out for Delivery 🚚",
                introLine: "Your order is now on its way. Please be prepared to receive it.",
                ct);
        }

        public Task TrySendDeliveredAsync(int orderId, int customerUserId, int driverUserId, CancellationToken ct = default)
        {
            return SendAsync(
                orderId,
                customerUserId,
                driverUserId,
                subject: $"QuickPharmaPlus – Delivered (#{orderId})",
                headerTitle: "Delivery Completed ✅",
                introLine: "Your order has been delivered successfully.",
                ct);
        }

        private async Task SendAsync(
            int orderId,
            int customerUserId,
            int driverUserId,
            string subject,
            string headerTitle,
            string introLine,
            CancellationToken ct)
        {
            var order = await _db.Orders
                .Include(o => o.User)
                .Include(o => o.OrderStatus)
                .Include(o => o.Payment)
                    .ThenInclude(p => p.PaymentMethod)
                .Include(o => o.Shipping)
                    .ThenInclude(s => s.ShippingSlot)
                .Include(o => o.Shipping)
                    .ThenInclude(s => s.Address)
                        .ThenInclude(a => a.City)
                .Include(o => o.ProductOrders)
                    .ThenInclude(po => po.Product)
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == customerUserId, ct);

            if (order == null) return;

            var customer = order.User;
            if (customer == null || string.IsNullOrWhiteSpace(customer.EmailAddress)) return;

            var driver = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == driverUserId, ct);

            if (driver == null) return;

            var paymentMethodName = order.Payment?.PaymentMethod?.PaymentMethodName ?? "—";
            var isPaid = order.Payment?.PaymentIsSuccessful == true;
            var paidLabel = isPaid ? "Paid" : "Not paid";

            // NEW: total amount (prefer PaymentAmount, fallback to OrderTotal)
            var totalAmountBhd = order.Payment?.PaymentAmount ?? order.OrderTotal;
            var totalAmountLabel = totalAmountBhd.HasValue ? totalAmountBhd.Value.ToString("0.000") : "—";

            var addr = order.Shipping?.Address;
            var locationLabel =
                addr == null
                    ? "—"
                    : $"{addr.City?.CityName ?? "City"}, Block {addr.Block ?? "—"}, Road {addr.Street ?? "—"}, Building {addr.BuildingNumber ?? "—"}";

            var slot = order.Shipping?.ShippingSlot;
            var slotLabel = slot?.SlotName ?? "—";

            var bahrainNow = DateTime.UtcNow.AddHours(3);

            var driverName = $"{driver.FirstName} {driver.LastName}".Trim();
            if (string.IsNullOrWhiteSpace(driverName)) driverName = "Driver";

            var items = (order.ProductOrders ?? new List<ProductOrder>())
                .Select(po =>
                {
                    var name = po.Product?.ProductName ?? "Item";
                    var qty = po.Quantity;
                    return new { name, qty };
                })
                .ToList();

            var itemsHtml = string.Join("", items.Select(i =>
                $"<li>{WebUtility.HtmlEncode(i.name)} × {i.qty}</li>"
            ));

            var body = $@"
                <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #111'>
                    <h2 style='margin: 0 0 8px 0'>{WebUtility.HtmlEncode(headerTitle)}</h2>
                    <p style='margin: 0 0 12px 0'>Hi {WebUtility.HtmlEncode(customer.FirstName ?? "Customer")},</p>

                    <p style='margin: 0 0 12px 0'>{WebUtility.HtmlEncode(introLine)}</p>

                    <div style='margin: 12px 0; padding: 12px; border: 1px solid #ddd; border-radius: 10px; background: #fafafa'>
                        <p style='margin: 0 0 6px 0'><b>Order:</b> #{order.OrderId}</p>
                        <p style='margin: 0 0 6px 0'><b>Status:</b> {WebUtility.HtmlEncode(order.OrderStatus?.OrderStatusName ?? "—")}</p>
                        <p style='margin: 0 0 6px 0'><b>Timestamp (BH):</b> {bahrainNow:yyyy-MM-dd HH:mm}</p>
                        <p style='margin: 0 0 6px 0'><b>Delivery slot:</b> {WebUtility.HtmlEncode(slotLabel)}</p>
                        <p style='margin: 0 0 6px 0'><b>Location:</b> {WebUtility.HtmlEncode(locationLabel)}</p>
                        <p style='margin: 0 0 6px 0'><b>Payment:</b> {WebUtility.HtmlEncode(paymentMethodName)} ({paidLabel})</p>
                        <p style='margin: 0 0 6px 0'><b>Total Amount (BHD):</b> {WebUtility.HtmlEncode(totalAmountLabel)}</p>
                    </div>

                    <div style='margin: 12px 0; padding: 12px; border: 1px solid #ddd; border-radius: 10px'>
                        <p style='margin: 0 0 6px 0'><b>Your driver:</b> {WebUtility.HtmlEncode(driverName)}</p>
                        <p style='margin: 0 0 6px 0'><b>Phone:</b> {WebUtility.HtmlEncode(driver.ContactNumber ?? "—")}</p>
                        <p style='margin: 0 0 6px 0'><b>Email:</b> {WebUtility.HtmlEncode(driver.EmailAddress ?? "—")}</p>
                    </div>

                    <p style='margin: 12px 0 6px 0'><b>Items:</b></p>
                    <ul style='margin: 0 0 12px 20px; padding: 0'>
                        {itemsHtml}
                    </ul>

                    <p style='margin: 0'>Thank you for using QuickPharmaPlus.</p>
                </div>";

            await _emailSender.SendEmailAsync(customer.EmailAddress, subject, body);
        }
    }
}