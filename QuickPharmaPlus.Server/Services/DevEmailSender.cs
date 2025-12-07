using Microsoft.AspNetCore.Identity.UI.Services;

namespace QuickPharmaPlus.Server.Services
{
    public class DevEmailSender : IEmailSender
    {
        private readonly ILogger<DevEmailSender> _logger;

        public DevEmailSender(ILogger<DevEmailSender> logger)
        {
            _logger = logger;
        }

        public Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            _logger.LogInformation("DEV EMAIL -> To: {Email}", email);
            _logger.LogInformation("SUBJECT: {Subject}", subject);
            _logger.LogInformation("BODY: {Body}", htmlMessage);

            return Task.CompletedTask;
        }
    }
}
