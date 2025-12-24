using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Interface;
using Microsoft.AspNetCore.Identity;
using QuickPharmaPlus.Server.Identity;


namespace QuickPharmaPlus.Server.Controllers.External_System
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class HealthProfileIllnessController : ControllerBase
    {
        private readonly IHealthProfileIllnessRepository _repo;
        private readonly QuickPharmaPlusDbContext _context;
        private readonly IQuickPharmaLogRepository _logRepo;
        private readonly UserManager<ApplicationUser> _userManager;


        public HealthProfileIllnessController(
     IHealthProfileIllnessRepository repo,
     QuickPharmaPlusDbContext context,
     IQuickPharmaLogRepository logRepo,
     UserManager<ApplicationUser> userManager)
        {
            _repo = repo;
            _context = context;
            _logRepo = logRepo;
            _userManager = userManager;
        }

        private async Task<int?> GetCurrentUserIdAsync()
        {
            var email = User?.Identity?.Name;
            if (string.IsNullOrWhiteSpace(email)) return null;

            var domainUser = await _context.Users
                .FirstOrDefaultAsync(u => u.EmailAddress == email);

            return domainUser?.UserId;
        }


        // GET: /api/HealthProfileIllness?userId=123
        [HttpGet]
        public async Task<IActionResult> GetMyIllnesses([FromQuery] int userId)
        {
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var items = await _repo.GetMyAsync(userId);
                return Ok(new { count = items.Count, items });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "HealthProfile illness get failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // POST: /api/HealthProfileIllness?userId=123&illnessNameId=5&severityId=2
        [HttpPost]
        public async Task<IActionResult> AddIllness(
            [FromQuery] int userId,
            [FromQuery] int illnessNameId,
            [FromQuery] int severityId)
        {
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });
            if (illnessNameId <= 0) return BadRequest(new { error = "Invalid illnessNameId" });
            if (severityId <= 0) return BadRequest(new { error = "Invalid severityId" });

            try
            {

                var currentUserId = await GetCurrentUserIdAsync();
                if (!currentUserId.HasValue || currentUserId.Value != userId)
                    return Forbid();


                // resolve illnessId from name+severity
                var illnessId = await _context.Illnesses
                    .Where(i => i.IllnessNameId == illnessNameId)
                    .Select(i => (int?)i.IllnessId)
                    .FirstOrDefaultAsync();

                if (illnessId == null)
                    return Ok(new { added = false });

                var added = await _repo.AddAsync(userId, illnessId.Value, severityId);
                
                
                
                if (added)
                {
                    var illnessName = await _context.IllnessNames
                        .Where(n => n.IllnessNameId == illnessNameId)
                        .Select(n => n.IllnessName1)
                        .FirstOrDefaultAsync();

                    var severityName = await _context.Severities
                        .Where(s => s.SeverityId == severityId)
                        .Select(s => s.SeverityName)
                        .FirstOrDefaultAsync();

                    var details = $"Illness: {illnessName ?? "Unknown"}, Severity: {severityName ?? severityId.ToString()}";

                    await _logRepo.CreateAddRecordLogAsync(
                        currentUserId.Value,
                        "Illness",
                        illnessId.Value,
                        details
                    );
                }


                return Ok(new { added });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "HealthProfile illness add failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // PUT: /api/HealthProfileIllness/{healthProfileIllnessId}?userId=123&illnessNameId=5&severityId=3
        [HttpPut("{healthProfileIllnessId:int}")]
        public async Task<IActionResult> UpdateIllness(
            int healthProfileIllnessId,
            [FromQuery] int userId,
            [FromQuery] int illnessNameId,
            [FromQuery] int severityId)
        {
            if (healthProfileIllnessId <= 0) return BadRequest(new { error = "Invalid healthProfileIllnessId" });
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });
            if (illnessNameId <= 0) return BadRequest(new { error = "Invalid illnessNameId" });
            if (severityId <= 0) return BadRequest(new { error = "Invalid severityId" });

            try
            {
                var currentUserId = await GetCurrentUserIdAsync();
                if (!currentUserId.HasValue || currentUserId.Value != userId)
                    return Forbid();

                var before = await _context.HealthProfileIllnesses
            .Include(x => x.Illness).ThenInclude(i => i.IllnessName)
            .Include(x => x.Severity)
            .Include(x => x.HealthProfile)
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.HealthProfileIllnessId == healthProfileIllnessId &&
                x.HealthProfile != null &&
                x.HealthProfile.UserId == userId);

                if (before == null)
                    return Ok(new { updated = false });

                // resolve illnessId from name+severity
                var illnessId = await _context.Illnesses
                    .Where(i => i.IllnessNameId == illnessNameId)
                    .Select(i => (int?)i.IllnessId)
                    .FirstOrDefaultAsync();

                if (illnessId == null)
                    return Ok(new { updated = false });

                var updated = await _repo.UpdateAsync(userId, healthProfileIllnessId, illnessId.Value, severityId);

                if (updated)
                {
                    var newIllnessName = await _context.IllnessNames
                        .Where(n => n.IllnessNameId == illnessNameId)
                        .Select(n => n.IllnessName1)
                        .FirstOrDefaultAsync();

                    var newSeverityName = await _context.Severities
                        .Where(s => s.SeverityId == severityId)
                        .Select(s => s.SeverityName)
                        .FirstOrDefaultAsync();

                    var details =
                        $"HealthProfileIllnessId: {healthProfileIllnessId}, " +
                        $"Illness: {(before.Illness?.IllnessName?.IllnessName1 ?? "Unknown")} → {newIllnessName ?? "Unknown"}, " +
                        $"Severity: {(before.Severity?.SeverityName ?? "Unknown")} → {newSeverityName ?? severityId.ToString()}";

                    await _logRepo.CreateEditRecordLogAsync(
                        currentUserId.Value,
                        "Illness",
                        illnessId.Value,
                        details
                    );
                }


                return Ok(new { updated });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "HealthProfile illness update failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // DELETE: /api/HealthProfileIllness/{healthProfileIllnessId}?userId=123
        [HttpDelete("{healthProfileIllnessId:int}")]
        public async Task<IActionResult> RemoveIllness(int healthProfileIllnessId, [FromQuery] int userId)
        {
            if (healthProfileIllnessId <= 0) return BadRequest(new { error = "Invalid healthProfileIllnessId" });
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var currentUserId = await GetCurrentUserIdAsync();
                if (!currentUserId.HasValue || currentUserId.Value != userId)
                    return Forbid();

                // BEFORE (for log)
                var before = await _context.HealthProfileIllnesses
                    .Include(x => x.Illness).ThenInclude(i => i.IllnessName)
                    .Include(x => x.Severity)
                    .Include(x => x.HealthProfile)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x =>
                        x.HealthProfileIllnessId == healthProfileIllnessId &&
                        x.HealthProfile != null &&
                        x.HealthProfile.UserId == userId);


                var removed = await _repo.RemoveAsync(userId, healthProfileIllnessId);

                if (removed && before != null)
                {
                    var details =
                        $"HealthProfileIllnessId: {healthProfileIllnessId}, " +
                        $"Illness: {before.Illness?.IllnessName?.IllnessName1 ?? "Unknown"}, " +
                        $"Severity: {before.Severity?.SeverityName ?? "Unknown"}";

                    await _logRepo.CreateDeleteRecordLogAsync(
                        currentUserId.Value,
                        "Illness",
                        before.IllnessId ?? 0,
                        details
                    );
                }

                return Ok(new { removed });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "HealthProfile illness remove failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }
    }
}
