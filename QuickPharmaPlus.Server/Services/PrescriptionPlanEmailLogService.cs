using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.PrescriptionPlan;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.Json;

namespace QuickPharmaPlus.Server.Services
{
    public interface IPrescriptionPlanEmailLogService
    {
        Task SchedulePlanEmailsAsync(int planId, int userId, DateOnly creationDateBahrain, DateOnly? expiryDateBahrain, CancellationToken ct = default);
        Task SendDueScheduledEmailsAsync(CancellationToken ct = default);
    }

    public class PrescriptionPlanEmailLogService : IPrescriptionPlanEmailLogService
    {
        private const string SCHEDULED_PREFIX = "PP_EMAIL_SCHEDULED|";
        private const string SENT_PREFIX = "PP_EMAIL_SENT|";
        private const string STOCK_APPLIED_PREFIX = "PP_STOCK_APPLIED|";
        private static readonly TimeOnly BAHRAIN_SEND_TIME = new(7, 30); // 07:30 AM

        private readonly QuickPharmaPlusDbContext _db;
        private readonly IEmailSender _emailSender;
        private readonly ILogger<PrescriptionPlanEmailLogService> _logger;
        private readonly IQuickPharmaLogRepository _logRepo;


        public PrescriptionPlanEmailLogService(
     QuickPharmaPlusDbContext db,
     IEmailSender emailSender,
     ILogger<PrescriptionPlanEmailLogService> logger,
     IQuickPharmaLogRepository logRepo)
        {
            _db = db;
            _emailSender = emailSender;
            _logger = logger;
            _logRepo = logRepo;
        }


        private class Payload
        {
            public int PlanId { get; set; }
            public int UserId { get; set; }
            public string Stage { get; set; } = "";   // READY_TODAY | REMINDER
            public int OffsetDays { get; set; }       // 1, 27, 30, 57, 60, ...
            public DateTime SendOnUtc { get; set; }
            public string DedupKey { get; set; } = "";
        }

        private static DateTime BahrainLocalToUtc(DateTime bahrainLocal) => bahrainLocal.AddHours(-3);

        public async Task SchedulePlanEmailsAsync(
    int planId,
    int userId,
    DateOnly creationDateBahrain,
    DateOnly? expiryDateBahrain,
    CancellationToken ct = default)
        {
            var createdLocal = creationDateBahrain.ToDateTime(BAHRAIN_SEND_TIME); // 07:30 Bahrain
            DateTime? expiryLocal = expiryDateBahrain?.ToDateTime(BAHRAIN_SEND_TIME);


            var jobs = new List<Payload>();

            // Safety cap: max 24 cycles (~2 years)
            for (var m = 0; m < 24; m++)
            {
                // READY: Day 1 (tomorrow), then Day 31, Day 61, ...
                var readyLocal = createdLocal.AddDays(1 + 30 * m);

                if (expiryLocal.HasValue && readyLocal > expiryLocal.Value)
                    break;

                // REMINDER: 3 days before READY
                // BUT do NOT schedule reminder for the first READY (m=0), because that would be Day -2
                if (m >= 1)
                {
                    var reminderLocal = readyLocal.AddDays(-3); // Day 28, 58, 88, ...

                    jobs.Add(new Payload
                    {
                        PlanId = planId,
                        UserId = userId,
                        Stage = "REMINDER",
                        OffsetDays = (1 + 30 * m) - 3,
                        SendOnUtc = BahrainLocalToUtc(reminderLocal),
                        DedupKey = $"PP|{planId}|REMINDER|M{m}"
                    });
                }

                jobs.Add(new Payload
                {
                    PlanId = planId,
                    UserId = userId,
                    Stage = "READY_TODAY",
                    OffsetDays = 1 + 30 * m,
                    SendOnUtc = BahrainLocalToUtc(readyLocal),
                    DedupKey = m == 0
                        ? $"PP|{planId}|READY_TODAY|D1"
                        : $"PP|{planId}|READY_TODAY|M{m}"
                });
            }

            // dedupe scheduling (keep your existing code)
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
            _logger.LogInformation("[PP Email] Scheduled monthly emails for planId={PlanId}", planId);
        }


        public async Task SendDueScheduledEmailsAsync(CancellationToken ct = default)
        {
            var nowUtc = DateTime.UtcNow;

            // load scheduled logs (parse & filter in-memory)
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

                // STOP if prescription is expired
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var expiry = plan.Approval?.ApprovalPrescriptionExpiryDate;

                if (expiry.HasValue && expiry.Value < today)
                {
                    continue;
                }


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

                // ✅ stock decrease on READY_TODAY, once per cycle (dedupe)
                if (job.Stage == "READY_TODAY")
                {
                    var alreadyApplied = await _db.Logs.AnyAsync(l =>
                        l.LogDescription != null &&
                        l.LogDescription.StartsWith(STOCK_APPLIED_PREFIX) &&
                        l.LogDescription.Contains(job.DedupKey), ct);

                    if (!alreadyApplied)
                    {
                        var applied = await ApplyMonthlyStockDecreaseAsync(plan, ct);

                        if (applied)
                        {
                            // Log inventory decrease 
                            await _logRepo.CreateInventoryChangeLogAsync(
                                userId: user.UserId,
                                productName: plan.Approval?.ApprovalProductName ?? "Plan item",
                                branchId: plan.Shipping?.BranchId
                            );

                            // keep your existing plan-email stock marker 
                            _db.Logs.Add(new Log
                            {
                                UserId = user.UserId,
                                LogTypeId = LogTypeConstants.PrescriptionPlanEmail,
                                LogTimestamp = DateTime.UtcNow,
                                LogDescription = $"{STOCK_APPLIED_PREFIX}{job.DedupKey}|Plan={plan.PrescriptionPlanId}"
                            });

                            await _db.SaveChangesAsync(ct);
                        }

                    }
                }

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

                // ✅ You can also stock-check delivery if you want (optional).
                // For now we allow send; stock will be decremented only when ApplyMonthlyStockDecreaseAsync succeeds.

                return (true, methodLabel, addressLine, total);
            }

            // PICKUP: show branch city name
            string? branchCityName = shipping.Branch?.Address?.City?.CityName;

            // fallback if branch navigation is missing
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

                // find productId from approved product name
                var productId = await _db.Products
                    .Where(p => p.ProductName == plan.Approval!.ApprovalProductName)
                    .Select(p => (int?)p.ProductId)
                    .FirstOrDefaultAsync(ct);

                if (productId == null) return (false, methodLabel, branchLabel, total);

                var available = await _db.Inventories
                    .Where(i => i.BranchId == shipping.BranchId.Value && i.ProductId == productId.Value)
                    .Where(i => i.InventoryQuantity != null && i.InventoryQuantity > 0)
                    .SumAsync(i => (int?)(i.InventoryQuantity ?? 0), ct) ?? 0;

                if (available < requiredQty) return (false, methodLabel, branchLabel, total);

            }

            return (true, methodLabel, branchLabel, total);
        }

        private string GetPrescriptionDisplayName(PrescriptionPlan plan)
        {
            var prescriptionName = plan.Approval?.Prescription?.PrescriptionName;
            if (!string.IsNullOrWhiteSpace(prescriptionName))
                return prescriptionName;

            var productName = plan.Approval?.ApprovalProductName;
            if (!string.IsNullOrWhiteSpace(productName))
                return productName;

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

        // ============================
        // STOCK DECREASE (FEFO)
        // ============================
        private async Task<bool> ApplyMonthlyStockDecreaseAsync(PrescriptionPlan plan, CancellationToken ct)
        {
            var shipping = plan.Shipping;
            var approval = plan.Approval;

            if (shipping?.BranchId == null) return false;
            if (approval == null) return false;

            var qty = approval.ApprovalQuantity ?? 0;
            if (qty <= 0) return false;

            // Find productId by approved product name (same idea you used in plan create)
            var productId = await _db.Products
                .Where(p => p.ProductName == approval.ApprovalProductName)
                .Select(p => (int?)p.ProductId)
                .FirstOrDefaultAsync(ct);

            if (productId == null) return false;

            // Ensure total stock is sufficient before decrement (no partial)
            var totalAvailable = await _db.Inventories
                .Where(i => i.BranchId == shipping.BranchId.Value && i.ProductId == productId.Value)
                .Where(i => i.InventoryQuantity != null && i.InventoryQuantity > 0)
                .SumAsync(i => (int?)(i.InventoryQuantity ?? 0), ct) ?? 0;

            if (totalAvailable < qty) return false;

            var remaining = qty;

            // FEFO: earliest expiry first, null expiry last
            var rows = await _db.Inventories
                .Where(i => i.BranchId == shipping.BranchId.Value && i.ProductId == productId.Value)
                .Where(i => i.InventoryQuantity != null && i.InventoryQuantity > 0)
                .OrderBy(i => i.InventoryExpiryDate == null) // false first (has expiry), true last (null)
                .ThenBy(i => i.InventoryExpiryDate)
                .ToListAsync(ct);

            foreach (var inv in rows)
            {
                if (remaining <= 0) break;

                var have = inv.InventoryQuantity ?? 0;
                if (have <= 0) continue;

                var take = Math.Min(have, remaining);
                inv.InventoryQuantity = have - take;
                remaining -= take;
            }

            if (remaining > 0)
            {
                // Shouldn't happen because we pre-checked totalAvailable
                _logger.LogWarning("[PP Stock] Unexpected remaining qty after FEFO. PlanId={PlanId}, Remaining={Remaining}",
                    plan.PrescriptionPlanId, remaining);
                return false;
            }

            await _db.SaveChangesAsync(ct);

            _logger.LogInformation("[PP Stock] Decreased stock for PlanId={PlanId}, Product={Product}, Qty={Qty}, BranchId={BranchId}",
                plan.PrescriptionPlanId,
                approval.ApprovalProductName,
                qty,
                shipping.BranchId.Value);

            return true;
        }
    }
}
