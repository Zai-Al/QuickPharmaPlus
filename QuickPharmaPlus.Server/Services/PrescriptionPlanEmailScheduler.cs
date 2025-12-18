using QuickPharmaPlus.Server.Services;

namespace QuickPharmaPlus.Server.Services
{
    public class PrescriptionPlanEmailScheduler : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<PrescriptionPlanEmailScheduler> _logger;

        public PrescriptionPlanEmailScheduler(
            IServiceScopeFactory scopeFactory,
            ILogger<PrescriptionPlanEmailScheduler> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Prescription Plan Email Scheduler started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var svc = scope.ServiceProvider.GetRequiredService<IPrescriptionPlanEmailLogService>();

                    await svc.SendDueScheduledEmailsAsync(stoppingToken);

                    // every 1 minute (testing); change later to 15 mins / 1 hour
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
                catch (TaskCanceledException) { }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "PrescriptionPlanEmailScheduler failed.");
                    await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
                }
            }
        }
    }
}
