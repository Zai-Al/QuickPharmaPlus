using Microsoft.AspNetCore.Identity.UI.Services;
using System.Net;
using System.Net.Mail;

namespace QuickPharmaPlus.Server.Services
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly IConfiguration _config;

        public SmtpEmailSender(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            var smtpConfig = _config.GetSection("EmailSettings:Smtp");

            var host = smtpConfig["Host"];
            var port = int.Parse(smtpConfig["Port"]);
            var user = smtpConfig["User"];
            var pass = smtpConfig["Pass"];
            var from = smtpConfig["From"];

            var smtp = new SmtpClient(host, port)
            {
                EnableSsl = true,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(user, pass)
            };

            var mail = new MailMessage(from, email, subject, htmlMessage)
            {
                IsBodyHtml = true
            };

            try
            {
                await smtp.SendMailAsync(mail);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"SMTP send failed: {ex.Message}");
                throw;
            }
        }
    }
}
