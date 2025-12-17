using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Prescription;
using QuickPharmaPlus.Server.ModelsDTO.PrescriptionPlan;

namespace QuickPharmaPlus.Server.Services
{
    public class PrescriptionPlanEmailScheduler : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<PrescriptionPlanEmailScheduler> _logger;
        private readonly IConfiguration _config;

        public PrescriptionPlanEmailScheduler(
            IServiceScopeFactory scopeFactory,
            ILogger<PrescriptionPlanEmailScheduler> logger,
            IConfiguration config)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _config = config;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Prescription Plan Email Scheduler started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Run daily at configured Bahrain hour
                    var nextRunUtc = GetNextRunUtc();
                    var delay = nextRunUtc - DateTime.UtcNow;

                    if (delay < TimeSpan.Zero) delay = TimeSpan.FromMinutes(1);

                    await Task.Delay(delay, stoppingToken);

                    await RunOnce(stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    // shutting down
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "PrescriptionPlanEmailScheduler failed.");
                }
            }
        }

        private DateTime GetNextRunUtc()
        {
            // Bahrain is UTC+3 (no DST)
            var runHourLocal = _config.GetValue<int?>("PrescriptionPlanEmails:RunHourLocal") ?? 9;

            var nowUtc = DateTime.UtcNow;
            var nowBahrain = nowUtc.AddHours(3);

            var todayRunBahrain = new DateTime(
                nowBahrain.Year, nowBahrain.Month, nowBahrain.Day,
                runHourLocal, 0, 0, DateTimeKind.Unspecified);

            var nextRunBahrain = nowBahrain <= todayRunBahrain
                ? todayRunBahrain
                : todayRunBahrain.AddDays(1);

            // Convert back to UTC by subtracting 3 hours
            return nextRunBahrain.AddHours(-3);
        }

        private async Task RunOnce(CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<QuickPharmaPlusDbContext>();
            var emailSender = scope.ServiceProvider.GetRequiredService<IEmailSender>();

            var cycleDays = _config.GetValue<int?>("PrescriptionPlanEmails:CycleDays") ?? 30;
            var reminderDaysBefore = _config.GetValue<int?>("PrescriptionPlanEmails:ReminderDaysBefore") ?? 3;
            var initialDelayDays = _config.GetValue<int?>("PrescriptionPlanEmails:InitialEmailDelayDays") ?? 0;

            var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3)); // Bahrain date

            var plans = await db.PrescriptionPlans
                .Include(p => p.User)
                .Include(p => p.Approval).ThenInclude(a => a.Prescription)
                .Include(p => p.Shipping).ThenInclude(s => s.Address).ThenInclude(a => a.City)
                .Where(p => p.PrescriptionPlanStatusId == PrescriptionPlanStatusConstants.Ongoing)
                .ToListAsync(ct);

            foreach (var plan in plans)
            {
                if (ct.IsCancellationRequested) break;

                var approval = plan.Approval;
                var prescription = approval?.Prescription;
                var user = plan.User;

                if (approval == null || prescription == null || user == null)
                    continue;

                // 1) Expiry check
                if (approval.ApprovalPrescriptionExpiryDate != null &&
                    approval.ApprovalPrescriptionExpiryDate < today)
                {
                    prescription.PrescriptionStatusId = PrescriptionStatusConstants.Expired;
                    plan.PrescriptionPlanStatusId = PrescriptionPlanStatusConstants.Expired;

                    await db.SaveChangesAsync(ct);
                    continue;
                }

                if (plan.PrescriptionPlanCreationDate == null)
                    continue;

                var start = plan.PrescriptionPlanCreationDate.Value;

                var daysSinceStart = today.DayNumber - start.DayNumber;
                if (daysSinceStart < 0) continue;

                // shift cycle start by initial delay (for testing)
                var shifted = daysSinceStart - initialDelayDays;
                if (shifted < 0) continue;

                var cycle = shifted / cycleDays;
                var dayInCycle = shifted % cycleDays;

                var reminderDay = Math.Max(0, cycleDays - reminderDaysBefore);

                string? stage = null;
                if (dayInCycle == 0) stage = "READY_TODAY";
                else if (dayInCycle == reminderDay) stage = "REMINDER";

                if (stage == null) continue;

                // 2) log dedupe
                var logKey = $"PP_EMAIL|PlanId={plan.PrescriptionPlanId}|Stage={stage}|Cycle={cycle}";
                var alreadySent = await db.Logs.AnyAsync(l =>
                    l.LogTypeId == LogTypeConstants.PrescriptionPlanEmail &&
                    l.LogDescription != null &&
                    l.LogDescription.Contains(logKey),
                    ct);

                if (alreadySent) continue;

                // 3) stock check (READY_TODAY requires stock; reminder doesn't)
                var stockInfo = await CheckStockAsync(db, plan, approval, ct);

                if (stage == "READY_TODAY" && !stockInfo.HasStock)
                    continue;

                // 4) send email
                var subject = stage == "REMINDER"
                    ? "QuickPharmaPlus – Monthly Prescription Reminder"
                    : "QuickPharmaPlus – Monthly Prescription Ready";

                var body = BuildEmailBody(stage, user.FirstName ?? "Customer", stockInfo, plan);

                await emailSender.SendEmailAsync(user.EmailAddress!, subject, body);

                // 5) log sent
                db.Logs.Add(new Log
                {
                    UserId = user.UserId,
                    LogTypeId = LogTypeConstants.PrescriptionPlanEmail,
                    LogTimestamp = DateTime.UtcNow,
                    LogDescription = $"{logKey}|Method={stockInfo.Method}|Branch={stockInfo.BranchLabel}"
                });

                await db.SaveChangesAsync(ct);
            }
        }

        private async Task<(bool HasStock, string Method, string BranchLabel)> CheckStockAsync(
            QuickPharmaPlusDbContext db,
            PrescriptionPlan plan,
            Approval approval,
            CancellationToken ct)
        {
            // pickup -> Shipping.BranchId
            // delivery -> for now: if shipping has no branch, we just treat as "Delivery (assigned by system)"
            int? branchId = plan.Shipping?.BranchId;

            var method = branchId != null ? "pickup" : "delivery";
            var branchLabel = branchId != null ? $"Branch #{branchId}" : "Assigned Branch";

            // If we don't have a branchId yet for delivery, skip stock check (or you can decide a rule later)
            if (branchId == null)
                return (true, method, branchLabel);

            // This assumes product is identified by ApprovalProductName (your table stores name, not ProductId)
            // For MVP: if ANY inventory in that branch has quantity >= required => treat as has stock.
            // (Later: map ApprovalProductName -> ProductId reliably.)
            var requiredQty = approval.ApprovalQuantity ?? 0;
            if (requiredQty <= 0) return (false, method, branchLabel);

            var hasStock = await db.Inventories.AnyAsync(i =>
                i.BranchId == branchId &&
                i.InventoryQuantity != null &&
                i.InventoryQuantity >= requiredQty,
                ct);

            return (hasStock, method, branchLabel);
        }

        private string BuildEmailBody(
            string stage,
            string customerName,
            (bool HasStock, string Method, string BranchLabel) stockInfo,
            PrescriptionPlan plan)
        {
            if (stage == "REMINDER")
            {
                return $@"
                Hello {customerName},

                This is a reminder that your monthly prescription will be ready in 3 days.

                Delivery Method: {stockInfo.Method.ToUpper()}
                Branch: {stockInfo.BranchLabel}

                Thank you,
                QuickPharmaPlus
                ";
            }

            // READY_TODAY
            var deliveryText = stockInfo.Method == "pickup"
                ? "Your prescription is ready to be picked up today."
                : "Your prescription will be delivered today.";

            return $@"
            Hello {customerName},

            {deliveryText}

            Delivery Method: {stockInfo.Method.ToUpper()}
            Branch: {stockInfo.BranchLabel}

            Thank you,
            QuickPharmaPlus
            ";
                    }
    }
}
