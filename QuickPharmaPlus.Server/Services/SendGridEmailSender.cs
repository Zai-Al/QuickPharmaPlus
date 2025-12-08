using Microsoft.AspNetCore.Identity.UI.Services;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace QuickPharmaPlus.Server.Services
{
    public class SendGridEmailSender : IEmailSender
    {
        private readonly string _apiKey;
        private readonly string _senderEmail;
        private readonly string _senderName;

        public SendGridEmailSender(IConfiguration config)
        {
            _apiKey = config["SendGrid:ApiKey"];
            _senderEmail = config["SendGrid:SenderEmail"];
            _senderName = config["SendGrid:SenderName"];
        }

        public async Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            var client = new SendGridClient(_apiKey);

            var msg = MailHelper.CreateSingleEmail(
                new EmailAddress(_senderEmail, _senderName),
                new EmailAddress(email),
                subject,
                htmlMessage,   // plaintext fallback
                htmlMessage    // html content
            );

            await client.SendEmailAsync(msg);
        }
    }
}
