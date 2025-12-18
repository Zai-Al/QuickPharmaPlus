using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.PrescriptionPlan;
using System.Text.Json;

namespace QuickPharmaPlus.Server.Services
{
    public interface IPrescriptionPlanEmailLogService
    {
        Task SchedulePlanEmailsAsync(int planId, int userId, DateOnly creationDateBahrain, CancellationToken ct = default);
        Task SendDueScheduledEmailsAsync(CancellationToken ct = default);
    }

    public class PrescriptionPlanEmailLogService : IPrescriptionPlanEmailLogService
    {
        private const string SCHEDULED_PREFIX = "PP_EMAIL_SCHEDULED|";
        private const string SENT_PREFIX = "PP_EMAIL_SENT|";

        private readonly QuickPharmaPlusDbContext _db;
        private readonly IEmailSender _emailSender;
        private readonly ILogger<PrescriptionPlanEmailLogService> _logger;

        public PrescriptionPlanEmailLogService(
            QuickPharmaPlusDbContext db,
            IEmailSender emailSender,
            ILogger<PrescriptionPlanEmailLogService> logger)
        {
            _db = db;
            _emailSender = emailSender;
            _logger = logger;
        }

        private class Payload
        {
            public int PlanId { get; set; }
            public int UserId { get; set; }
            public string Stage { get; set; } = "";   // READY_TODAY | REMINDER
            public int OffsetDays { get; set; }       // 1, 27, 30
            public DateTime SendOnUtc { get; set; }
            public string DedupKey { get; set; } = "";
        }

        private static DateTime BahrainLocalToUtc(DateTime bahrainLocal) => bahrainLocal.AddHours(-3);

        public async Task SchedulePlanEmailsAsync(int planId, int userId, DateOnly creationDateBahrain, CancellationToken ct = default)
        {
            var createdLocal = creationDateBahrain.ToDateTime(TimeOnly.MinValue); // Bahrain local 00:00
            var jobs = new List<Payload>
            {
                new() { PlanId = planId, UserId = userId, Stage="READY_TODAY", OffsetDays=1,
                    SendOnUtc = BahrainLocalToUtc(createdLocal.AddDays(1)),
                    DedupKey = $"PP|{planId}|READY_TODAY|D1" },

                new() { PlanId = planId, UserId = userId, Stage="REMINDER", OffsetDays=27,
                    SendOnUtc = BahrainLocalToUtc(createdLocal.AddDays(27)),
                    DedupKey = $"PP|{planId}|REMINDER|D27" },

                new() { PlanId = planId, UserId = userId, Stage="READY_TODAY", OffsetDays=30,
                    SendOnUtc = BahrainLocalToUtc(createdLocal.AddDays(30)),
                    DedupKey = $"PP|{planId}|READY_TODAY|D30" },
            };

            // dedupe scheduling
            var existing = await _db.Logs
                .Where(l => l.LogDescription != null && l.LogDescription.StartsWith(SCHEDULED_PREFIX))
                .Where(l => l.LogDescription!.Contains($"\"PlanId\":{planId}"))
                .Select(l => l.LogDescription!)
                .ToListAsync(ct);

            foreach (var job in jobs)
            {
                if (existing.Any(x => x.Contains(job.DedupKey))) continue;

                _db.Logs.Add(new Log
                {
                    UserId = userId,
                    LogTypeId = LogTypeConstants.PrescriptionPlanEmail,
                    LogTimestamp = DateTime.UtcNow,
                    LogDescription = SCHEDULED_PREFIX + JsonSerializer.Serialize(job)
                });
            }

            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("[PP Email] Scheduled emails for planId={PlanId}", planId);
        }

        public async Task SendDueScheduledEmailsAsync(CancellationToken ct = default)
        {
            var nowUtc = DateTime.UtcNow;

            // load scheduled logs (we’ll parse & filter in-memory)
            var scheduledLogs = await _db.Logs
                .Where(l => l.LogDescription != null && l.LogDescription.StartsWith(SCHEDULED_PREFIX))
                .OrderBy(l => l.LogTimestamp)
                .Take(300)
                .AsNoTracking()
                .ToListAsync(ct);

            foreach (var log in scheduledLogs)
            {
                if (ct.IsCancellationRequested) break;

                Payload? job;
                try
                {
                    var json = log.LogDescription!.Substring(SCHEDULED_PREFIX.Length);
                    job = JsonSerializer.Deserialize<Payload>(json);
                }
                catch
                {
                    continue;
                }

                if (job == null || job.SendOnUtc > nowUtc) continue;

                // dedupe SENT
                var alreadySent = await _db.Logs.AnyAsync(l =>
                    l.LogDescription != null &&
                    l.LogDescription.StartsWith(SENT_PREFIX) &&
                    l.LogDescription.Contains(job.DedupKey), ct);

                if (alreadySent) continue;

                // load plan + user
                var plan = await _db.PrescriptionPlans
                    .Include(p => p.User)
                    .Include(p => p.Approval).ThenInclude(a => a.Prescription)
                    .Include(p => p.Shipping)
                        .ThenInclude(s => s.Branch)
                            .ThenInclude(b => b.Address)
                                .ThenInclude(a => a.City)
                    .Include(p => p.Shipping)
                        .ThenInclude(s => s.Address)
                            .ThenInclude(a => a.City)
                    .FirstOrDefaultAsync(p => p.PrescriptionPlanId == job.PlanId, ct);


                var user = plan?.User;
                if (plan == null || user == null || string.IsNullOrWhiteSpace(user.EmailAddress)) continue;

                var info = await BuildEmailInfoAsync(plan, job.Stage, ct);
                if (!info.CanSend) continue;
                var prescriptionLabel = GetPrescriptionDisplayName(plan);


                var subject = job.Stage == "REMINDER"
                    ? "QuickPharmaPlus – Monthly Prescription Reminder"
                    : "QuickPharmaPlus – Monthly Prescription Ready";

                var body = BuildEmailHtml(
                    job.Stage,
                    user.FirstName ?? "Customer",
                    prescriptionLabel,
                    info.MethodLabel,
                    info.LocationLabel,
                    info.TotalAmount
                );


                await _emailSender.SendEmailAsync(user.EmailAddress!, subject, body);

                _db.Logs.Add(new Log
                {
                    UserId = user.UserId,
                    LogTypeId = LogTypeConstants.PrescriptionPlanEmail,
                    LogTimestamp = DateTime.UtcNow,
                    LogDescription = $"{SENT_PREFIX}{job.DedupKey}|Method={info.MethodLabel}|Location={info.LocationLabel}|Total={info.TotalAmount:0.000}"
                });

                await _db.SaveChangesAsync(ct);

            }
        }

        private async Task<(bool CanSend, string MethodLabel, string LocationLabel, decimal TotalAmount)> BuildEmailInfoAsync(
    PrescriptionPlan plan,
    string stage,
    CancellationToken ct)
        {
            var shipping = plan.Shipping;
            if (shipping == null)
                return (false, "Unknown", "Unknown", plan.PrescriptionPlanTotalAmount ?? 0m);

            var isDelivery = shipping.ShippingIsDelivery == true;
            var methodLabel = isDelivery ? "Delivery" : "Pickup";

            var total = plan.PrescriptionPlanTotalAmount ?? 0m;

            // DELIVERY: show address
            if (isDelivery)
            {
                var city = shipping.Address?.City?.CityName;
                var block = shipping.Address?.Block;
                var road = shipping.Address?.Street;
                var building = shipping.Address?.BuildingNumber;

                var addressLine = string.Join(", ",
                    new[]
                    {
                city,
                string.IsNullOrWhiteSpace(block) ? null : $"Block {block}",
                string.IsNullOrWhiteSpace(road) ? null : $"Road {road}",
                string.IsNullOrWhiteSpace(building) ? null : $"Building/Floor {building}",
                    }.Where(x => !string.IsNullOrWhiteSpace(x))
                );

                if (string.IsNullOrWhiteSpace(addressLine))
                    addressLine = "Delivery address on file";

                return (true, methodLabel, addressLine, total);
            }

            // PICKUP: show branch city name
            string? branchCityName = shipping.Branch?.Address?.City?.CityName;

            // fallback if branch navigation is missing in data
            if (string.IsNullOrWhiteSpace(branchCityName) && shipping.BranchId.HasValue)
            {
                branchCityName = await _db.Cities
                    .Where(c => c.BranchId == shipping.BranchId.Value)
                    .Select(c => c.CityName)
                    .FirstOrDefaultAsync(ct);
            }

            var branchLabel = !string.IsNullOrWhiteSpace(branchCityName)
                ? branchCityName
                : shipping.BranchId.HasValue ? $"Branch #{shipping.BranchId.Value}" : "Pickup branch";

            // Only block READY_TODAY if no stock (pickup)
            if (stage == "READY_TODAY")
            {
                var requiredQty = plan.Approval?.ApprovalQuantity ?? 0;
                if (!shipping.BranchId.HasValue || requiredQty <= 0)
                    return (false, methodLabel, branchLabel, total);

                var hasStock = await _db.Inventories.AnyAsync(i =>
                    i.BranchId == shipping.BranchId.Value &&
                    i.InventoryQuantity != null &&
                    i.InventoryQuantity >= requiredQty,
                    ct);

                if (!hasStock)
                    return (false, methodLabel, branchLabel, total);
            }

            return (true, methodLabel, branchLabel, total);
        }

        private string GetPrescriptionDisplayName(PrescriptionPlan plan)
        {
            // 1) Preferred: Prescription name
            var prescriptionName = plan.Approval?.Prescription?.PrescriptionName;
            if (!string.IsNullOrWhiteSpace(prescriptionName))
                return prescriptionName;

            // 2) Fallback: approved product name
            var productName = plan.Approval?.ApprovalProductName;
            if (!string.IsNullOrWhiteSpace(productName))
                return productName;

            // 3) Last resort
            return "your prescription";
        }


        private string BuildEmailHtml(
            string stage,
            string customerName,
            string prescriptionName,
            string methodLabel,
            string locationLabel,
            decimal totalAmount)
                {
                    var locationTitle = methodLabel == "Delivery" ? "Address" : "Branch";

                    if (stage == "REMINDER")
                    {
                        return $@"
                    <p>Hello {customerName},</p>

                    <p>
                        This is a reminder that <b>your prescription for {prescriptionName}</b>
                        will be ready in <b>3 days</b>.
                    </p>

                    <p>
                        <b>{locationTitle}:</b> {locationLabel}<br/>
                        <b>Total Amount:</b> {totalAmount:0.000} BHD
                    </p>

                    <p>Best regards,<br/>QuickPharmaPlus Support</p>
                ";
                    }

                    var readyText = methodLabel == "Pickup"
                        ? $"Your prescription for <b>{prescriptionName}</b> can be picked up <b>today</b>."
                        : $"Your prescription for <b>{prescriptionName}</b> will be delivered <b>today</b>.";

                    return $@"
                <p>Hello {customerName},</p>

                <p>{readyText}</p>

                <p>
                    <b>{locationTitle}:</b> {locationLabel}<br/>
                    <b>Total Amount:</b> {totalAmount:0.000} BHD
                </p>

                <p>Best regards,<br/>QuickPharmaPlus Support</p>
            ";
        }

    }
}
