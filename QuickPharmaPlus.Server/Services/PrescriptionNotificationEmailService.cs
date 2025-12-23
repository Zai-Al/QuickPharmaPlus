using Microsoft.AspNetCore.Identity.UI.Services;
using System.Net;

namespace QuickPharmaPlus.Server.Services
{
    public interface IPrescriptionNotificationEmailService
    {
        Task SendPrescriptionRejectedAsync(
            string toEmail,
            string customerName,
            int prescriptionId,
            string prescriptionName,
            string rejectedByName,
            DateTime bahrainTimestamp,
            string rejectionReason);

        Task SendPrescriptionApprovedAsync(
            string toEmail,
            string customerName,
            int prescriptionId,
            string prescriptionName,
            string approvedByName,
            DateTime bahrainTimestamp,
            string approvedProductName,
            int approvedQuantity,
            string? approvedDosage,
            DateOnly? expiryDate,
            int? orderId,
            int? shippingId);
    }

    public class PrescriptionNotificationEmailService : IPrescriptionNotificationEmailService
    {
        private readonly IEmailSender _emailSender;

        public PrescriptionNotificationEmailService(IEmailSender emailSender)
        {
            _emailSender = emailSender;
        }

        public async Task SendPrescriptionApprovedAsync(
            string toEmail,
            string customerName,
            int prescriptionId,
            string prescriptionName,
            string approvedByName,
            DateTime bahrainTimestamp,
            string approvedProductName,
            int approvedQuantity,
            string? approvedDosage,
            DateOnly? expiryDate,
            int? orderId,
            int? shippingId)
        {
            var subject = $"[QuickPharma+] Prescription Approved (ID: {prescriptionId})";

            var whenDate = bahrainTimestamp.ToString("MMMM dd, yyyy");
            var whenTime = bahrainTimestamp.ToString("hh:mm tt");

            var html = BuildPrescriptionApprovedHtml(
                customerName,
                prescriptionId,
                prescriptionName,
                approvedByName,
                whenDate,
                whenTime,
                approvedProductName,
                approvedQuantity,
                approvedDosage,
                expiryDate,
                orderId,
                shippingId);

            await _emailSender.SendEmailAsync(toEmail, subject, html);
        }

        public async Task SendPrescriptionRejectedAsync(
            string toEmail,
            string customerName,
            int prescriptionId,
            string prescriptionName,
            string rejectedByName,
            DateTime bahrainTimestamp,
            string rejectionReason)
        {
            var subject = $"[QuickPharma+] Prescription Rejected (ID: {prescriptionId})";

            var whenDate = bahrainTimestamp.ToString("MMMM dd, yyyy");
            var whenTime = bahrainTimestamp.ToString("hh:mm tt");

            var html = BuildPrescriptionRejectedHtml(
                customerName,
                prescriptionId,
                prescriptionName,
                rejectedByName,
                whenDate,
                whenTime,
                rejectionReason);

            await _emailSender.SendEmailAsync(toEmail, subject, html);
        }

        private static string BuildPrescriptionApprovedHtml(
            string customerName,
            int prescriptionId,
            string prescriptionName,
            string approvedByName,
            string approvedOnDate,
            string approvedOnTime,
            string approvedProductName,
            int approvedQuantity,
            string? approvedDosage,
            DateOnly? expiryDate,
            int? orderId,
            int? shippingId)
        {
            customerName = string.IsNullOrWhiteSpace(customerName) ? "Customer" : customerName;
            prescriptionName = string.IsNullOrWhiteSpace(prescriptionName) ? "Prescription" : prescriptionName;
            approvedByName = string.IsNullOrWhiteSpace(approvedByName) ? "Employee" : approvedByName;

            var expiryText = expiryDate.HasValue ? expiryDate.Value.ToString("yyyy-MM-dd") : "N/A";
            var dosageText = string.IsNullOrWhiteSpace(approvedDosage) ? "N/A" : approvedDosage;

            var orderText = orderId.HasValue ? orderId.Value.ToString() : "N/A";
            var shippingText = shippingId.HasValue ? shippingId.Value.ToString() : "N/A";

            return $@"
<div style='font-family: Arial, sans-serif; line-height: 1.6; max-width: 680px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>
    <div style='background: linear-gradient(135deg, #38b2ac 0%, #2c7a7b 100%); padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;'>
        <h2 style='color: white; margin: 0; font-size: 22px;'>Prescription Approved</h2>
        <p style='color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 13px;'>
            Reference ID: <strong>{prescriptionId}</strong>
        </p>
    </div>

    <p style='margin: 0 0 16px 0; font-size: 16px;'>
        Dear <strong>{WebUtility.HtmlEncode(customerName)}</strong>,
    </p>

    <p style='margin: 0 0 14px 0; font-size: 14px; color: #555;'>
        Your prescription request has been <strong style='color:#2e7d32;'>approved</strong>.
    </p>

    <div style='background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px 16px; margin: 16px 0; border-radius: 4px;'>
        <p style='margin: 0; color: #0d47a1; font-size: 14px;'>
            <strong>Prescription:</strong> {WebUtility.HtmlEncode(prescriptionName)}<br/>
            <strong>Prescription ID:</strong> {prescriptionId}<br/>
            <strong>Approved by:</strong> {WebUtility.HtmlEncode(approvedByName)}<br/>
            <strong>Approved on:</strong> {WebUtility.HtmlEncode(approvedOnDate)} at {WebUtility.HtmlEncode(approvedOnTime)}
        </p>
    </div>

    <div style='background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 20px 0;'>
        <h3 style='margin: 0 0 12px 0; font-size: 18px; color: #333; border-bottom: 2px solid #38b2ac; padding-bottom: 8px;'>
            Approved Medication Details
        </h3>

        <table style='width: 100%; border-collapse: collapse;'>
            <tr>
                <td style='padding: 8px 0; font-weight: bold; color: #555; width: 40%;'>Product:</td>
                <td style='padding: 8px 0; color: #333;'>{WebUtility.HtmlEncode(approvedProductName)}</td>
            </tr>
            <tr>
                <td style='padding: 8px 0; font-weight: bold; color: #555;'>Quantity:</td>
                <td style='padding: 8px 0; color: #333;'>{approvedQuantity}</td>
            </tr>
            <tr>
                <td style='padding: 8px 0; font-weight: bold; color: #555;'>Dosage:</td>
                <td style='padding: 8px 0; color: #333;'>{WebUtility.HtmlEncode(dosageText)}</td>
            </tr>
            <tr>
                <td style='padding: 8px 0; font-weight: bold; color: #555;'>Expiry Date:</td>
                <td style='padding: 8px 0; color: #333;'>{WebUtility.HtmlEncode(expiryText)}</td>
            </tr>
            <tr>
                <td style='padding: 8px 0; font-weight: bold; color: #555;'>Order ID:</td>
                <td style='padding: 8px 0; color: #333;'>{WebUtility.HtmlEncode(orderText)}</td>
            </tr>
            <tr>
                <td style='padding: 8px 0; font-weight: bold; color: #555;'>Shipping ID:</td>
                <td style='padding: 8px 0; color: #333;'>{WebUtility.HtmlEncode(shippingText)}</td>
            </tr>
        </table>
    </div>

    <p style='margin: 16px 0; font-size: 14px; color: #555;'>
        Please proceed with your checkout/order process to complete your purchase using this approved prescription.
    </p>

    <div style='margin-top: 26px; padding-top: 16px; border-top: 1px solid #e0e0e0;'>
        <p style='margin: 0; font-size: 13px; color: #888;'>
            Best regards,<br/>
            <strong style='color:#2c7a7b;'>QuickPharma+ Team</strong>
        </p>
        <p style='margin: 10px 0 0 0; font-size: 12px; color: #999;'>
            This is an automated email. Please do not reply directly to this message.
        </p>
    </div>
</div>";
        }

        private static string BuildPrescriptionRejectedHtml(
            string customerName,
            int prescriptionId,
            string prescriptionName,
            string rejectedByName,
            string rejectedOnDate,
            string rejectedOnTime,
            string rejectionReason)
        {
            customerName = string.IsNullOrWhiteSpace(customerName) ? "Customer" : customerName;
            prescriptionName = string.IsNullOrWhiteSpace(prescriptionName) ? "Prescription" : prescriptionName;
            rejectedByName = string.IsNullOrWhiteSpace(rejectedByName) ? "Employee" : rejectedByName;

            return $@"
<div style='font-family: Arial, sans-serif; line-height: 1.6; max-width: 680px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>
    <div style='background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;'>
        <h2 style='color: white; margin: 0; font-size: 22px;'>Prescription Rejected</h2>
        <p style='color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 13px;'>
            Reference ID: <strong>{prescriptionId}</strong>
        </p>
    </div>

    <p style='margin: 0 0 16px 0; font-size: 16px;'>
        Dear <strong>{WebUtility.HtmlEncode(customerName)}</strong>,
    </p>

    <p style='margin: 0 0 14px 0; font-size: 14px; color: #555;'>
        Unfortunately, your prescription request has been <strong style='color:#c0392b;'>rejected</strong>.
    </p>

    <div style='background-color: #f2dede; border-left: 4px solid #e74c3c; padding: 12px 16px; margin: 16px 0; border-radius: 4px;'>
        <p style='margin: 0; color: #a94442; font-size: 14px;'>
            <strong>Prescription:</strong> {WebUtility.HtmlEncode(prescriptionName)}<br/>
            <strong>Prescription ID:</strong> {prescriptionId}<br/>
            <strong>Rejected by:</strong> {WebUtility.HtmlEncode(rejectedByName)}<br/>
            <strong>Rejected on:</strong> {WebUtility.HtmlEncode(rejectedOnDate)} at {WebUtility.HtmlEncode(rejectedOnTime)}<br/>
            <strong>Reason:</strong> {WebUtility.HtmlEncode(rejectionReason)}
        </p>
    </div>

    <p style='margin: 16px 0; font-size: 14px; color: #555;'>
        If you have any questions, please contact our support team.
    </p>

    <div style='margin-top: 26px; padding-top: 16px; border-top: 1px solid #e0e0e0;'>
        <p style='margin: 0; font-size: 13px; color: #888;'>
            Best regards,<br/>
            <strong style='color:#c0392b;'>QuickPharma+ Team</strong>
        </p>
        <p style='margin: 10px 0 0 0; font-size: 12px; color: #999;'>
            This is an automated email. Please do not reply directly to this message.
        </p>
    </div>
</div>";
        }
    }
}