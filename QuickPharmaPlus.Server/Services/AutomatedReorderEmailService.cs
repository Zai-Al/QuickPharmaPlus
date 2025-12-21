using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.UI.Services;
using QuickPharmaPlus.Server.Models;

namespace QuickPharmaPlus.Server.Services
{
    public interface IAutomatedReorderEmailService
    {
        Task TrySendAutomatedReorderEmailAsync(
            int supplierOrderId,
            int productId,
            int branchId,
            int threshold,
            CancellationToken ct = default);
    }

    public class AutomatedReorderEmailService : IAutomatedReorderEmailService
    {
        private readonly QuickPharmaPlusDbContext _db;
        private readonly IEmailSender _emailSender;
        private readonly ILogger<AutomatedReorderEmailService> _logger;

        public AutomatedReorderEmailService(
            QuickPharmaPlusDbContext db,
            IEmailSender emailSender,
            ILogger<AutomatedReorderEmailService> logger)
        {
            _db = db;
            _emailSender = emailSender;
            _logger = logger;
        }

        public async Task TrySendAutomatedReorderEmailAsync(
            int supplierOrderId,
            int productId,
            int branchId,
            int threshold,
            CancellationToken ct = default)
        {
            try
            {
                _logger.LogInformation("📧 Starting email process for Supplier Order ID {OrderId}", supplierOrderId);

                // Load the supplier order with all related data
                var supplierOrder = await _db.SupplierOrders
                    .Include(so => so.Product)
                    .Include(so => so.Supplier)
                    .Include(so => so.Branch)
                        .ThenInclude(b => b.Address)
                            .ThenInclude(a => a.City)
                    .Include(so => so.Branch)
                        .ThenInclude(b => b.User) // Branch Manager
                    .FirstOrDefaultAsync(so => so.SupplierOrderId == supplierOrderId, ct);

                if (supplierOrder == null)
                {
                    _logger.LogWarning("⚠️ Supplier order {OrderId} not found for email notification.", supplierOrderId);
                    return;
                }

                _logger.LogInformation("✅ Supplier order loaded successfully");


                _logger.LogInformation("📦 Calculated current quantity for Product ID {ProductId} in Branch ID {BranchId}",
                    productId, branchId);

                // Get product and supplier info
                var productName = supplierOrder.Product?.ProductName ?? "Unknown Product";
                var supplierName = supplierOrder.Supplier?.SupplierName ?? "Unknown Supplier";
                var orderedQuantity = supplierOrder.SupplierOrderQuantity ?? 0;
                var branchCity = supplierOrder.Branch?.Address?.City?.CityName ?? "Unknown Branch";
                var branchManager = supplierOrder.Branch?.User;

                _logger.LogInformation("📦 Order Details - Product: {Product}, Supplier: {Supplier}, Branch: {Branch}",
                    productName, supplierName, branchCity);

                // Get admin users
                var adminUsers = await _db.Users
                    .Where(u => u.RoleId == 1) // Admin role ID is 1
                    .ToListAsync(ct);

                _logger.LogInformation("👥 Found {Count} admin users", adminUsers.Count);

                // Bahrain time (UTC+3)
                var bahrainNow = DateTime.UtcNow.AddHours(3);
                var orderDate = bahrainNow.ToString("MMMM dd, yyyy");
                var orderTime = bahrainNow.ToString("hh:mm tt");

                // Build email subject
                var subject = $"[QuickPharma+] Automated Order Notification: {productName} Threshold Reached";

                _logger.LogInformation("📝 Email subject: {Subject}", subject);

                // Send to branch manager
                if (branchManager != null && !string.IsNullOrWhiteSpace(branchManager.EmailAddress))
                {
                    _logger.LogInformation("📧 Sending email to Branch Manager: {Email}", branchManager.EmailAddress);

                    var managerBody = BuildEmailBody(
                        productName: productName,
                        supplierName: supplierName,
                        threshold: threshold,
                        orderedQuantity: orderedQuantity,
                        orderDate: orderDate,
                        orderTime: orderTime,
                        branchCity: branchCity,
                        recipientName: $"{branchManager.FirstName} {branchManager.LastName}".Trim()
                    );

                    await _emailSender.SendEmailAsync(
                        branchManager.EmailAddress,
                        subject,
                        managerBody
                    );

                    _logger.LogInformation("✅ Email sent successfully to branch manager: {Email}", branchManager.EmailAddress);
                }
                else
                {
                    _logger.LogWarning("⚠️ No branch manager email found for branch ID {BranchId}", branchId);
                }

                // Send to all admins
                foreach (var admin in adminUsers)
                {
                    if (!string.IsNullOrWhiteSpace(admin.EmailAddress))
                    {
                        _logger.LogInformation("📧 Sending email to Admin: {Email}", admin.EmailAddress);

                        var adminBody = BuildEmailBody(
                            productName: productName,
                            supplierName: supplierName,
                            threshold: threshold,
                            orderedQuantity: orderedQuantity,
                            orderDate: orderDate,
                            orderTime: orderTime,
                            branchCity: branchCity,
                            recipientName: $"{admin.FirstName} {admin.LastName}".Trim()
                        );

                        await _emailSender.SendEmailAsync(
                            admin.EmailAddress,
                            subject,
                            adminBody
                        );

                        _logger.LogInformation("✅ Email sent successfully to admin: {Email}", admin.EmailAddress);
                    }
                }

                _logger.LogInformation("🎉 All emails sent successfully for Order ID {OrderId}", supplierOrderId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to send automated reorder email for order {OrderId}", supplierOrderId);
                throw; // Re-throw to let caller know it failed
            }
        }

        private string BuildEmailBody(
            string productName,
            string supplierName,
            int threshold,
            int orderedQuantity,
            string orderDate,
            string orderTime,
            string branchCity,
            string recipientName)
        {
            return $@"
                <div style='font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                    <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;'>
                        <h2 style='color: white; margin: 0; font-size: 24px;'>⚠️ Automated Order Notification</h2>
                    </div>

                    <p style='margin: 0 0 16px 0; font-size: 16px;'>
                        Dear <strong>{System.Net.WebUtility.HtmlEncode(recipientName)}</strong>,
                    </p>

                    <p style='margin: 0 0 16px 0; font-size: 14px; color: #555;'>
                        This is an automated notification from the <strong>QuickPharma+</strong> system.
                    </p>

                    <div style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px; margin: 16px 0; border-radius: 4px;'>
                        <p style='margin: 0; color: #856404; font-size: 14px;'>
                            A new automated order has been generated for <strong>{System.Net.WebUtility.HtmlEncode(branchCity)}</strong> branch on 
                            <strong>{orderDate}</strong> at <strong>{orderTime}</strong>.
                        </p>
                    </div>

                    <p style='margin: 16px 0; font-size: 14px; color: #555;'>
                        This order was triggered because the quantity of <strong>{System.Net.WebUtility.HtmlEncode(productName)}</strong> 
                        (supplied by <strong>{System.Net.WebUtility.HtmlEncode(supplierName)}</strong>) has reached the defined threshold of 
                        <strong>{threshold}</strong> units.
                    </p>

                    <div style='background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 20px 0;'>
                        <h3 style='margin: 0 0 12px 0; font-size: 18px; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 8px;'>
                            📋 Order Details
                        </h3>

                        <table style='width: 100%; border-collapse: collapse;'>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; color: #555; width: 40%;'>Product:</td>
                                <td style='padding: 8px 0; color: #333;'>{System.Net.WebUtility.HtmlEncode(productName)}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; color: #555;'>Supplier:</td>
                                <td style='padding: 8px 0; color: #333;'>{System.Net.WebUtility.HtmlEncode(supplierName)}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; color: #555;'>Branch:</td>
                                <td style='padding: 8px 0; color: #333;'>{System.Net.WebUtility.HtmlEncode(branchCity)}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; color: #555;'>Threshold:</td>
                                <td style='padding: 8px 0; color: #333;'>{threshold} units</td>
                            </tr>
                            <tr style='background-color: #e8f5e9;'>
                                <td style='padding: 8px 0; font-weight: bold; color: #2e7d32;'>Ordered Quantity:</td>
                                <td style='padding: 8px 0; color: #2e7d32; font-weight: bold;'>{orderedQuantity} units</td>
                            </tr>
                        </table>
                    </div>

                    <div style='background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px 16px; margin: 20px 0; border-radius: 4px;'>
                        <p style='margin: 0; color: #0d47a1; font-size: 14px;'>
                            ℹ️ This order is currently <strong>pending supplier approval</strong>. Once the supplier confirms, 
                            you will receive a further update.
                        </p>
                    </div>

                    <p style='margin: 20px 0 0 0; font-size: 14px; color: #555;'>
                        Thank you for your attention.
                    </p>

                    <div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;'>
                        <p style='margin: 0; font-size: 14px; color: #888;'>
                            Best regards,<br/>
                            <strong style='color: #667eea;'>QuickPharma+ Automated Notifications</strong>
                        </p>
                    </div>
                </div>
            ";
        }
    }
}