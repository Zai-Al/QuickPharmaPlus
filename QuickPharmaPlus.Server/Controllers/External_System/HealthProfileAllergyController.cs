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
    [Authorize (Roles = "Customer")]
    public class HealthProfileAllergyController : ControllerBase
    {
        private readonly IHealthProfileAllergyRepository _repo;
        private readonly QuickPharmaPlusDbContext _context;
        private readonly IQuickPharmaLogRepository _logRepo;
        private readonly UserManager<ApplicationUser> _userManager;


        public HealthProfileAllergyController(
     IHealthProfileAllergyRepository repo,
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


        // GET: /api/HealthProfileAllergy?userId=123
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int userId)
        {
            if (userId <= 0)
                return BadRequest(new { error = "Invalid userId" });

            var items = await _repo.GetMyAsync(userId);
            return Ok(new { items });
        }

        // POST: /api/HealthProfileAllergy?userId=123&allergyNameId=5&severityId=2
        [HttpPost]
        public async Task<IActionResult> Add(
            [FromQuery] int userId,
            [FromQuery] int allergyNameId,
            [FromQuery] int severityId)
        {
            if (userId <= 0 || allergyNameId <= 0 || severityId <= 0)
                return BadRequest(new { error = "Invalid parameters" });

            var currentUserId = await GetCurrentUserIdAsync();
            if (!currentUserId.HasValue || currentUserId.Value != userId)
                return Forbid();

            // IMPORTANT: scaffolded column name is AlleryNameId
            var allergyId = await _context.Allergies
                .Where(a => a.AlleryNameId == allergyNameId)
                .Select(a => (int?)a.AllergyId)
                .FirstOrDefaultAsync();

            if (allergyId == null)
                return Ok(new { added = false });

            var added = await _repo.AddAsync(userId, allergyId.Value, severityId);

            if (added)
            {
                var allergyName = await _context.AllergyNames
                    .Where(n => n.AlleryNameId == allergyNameId)
                    .Select(n => n.AllergyName1)
                    .FirstOrDefaultAsync();

                var severityName = await _context.Severities
                    .Where(s => s.SeverityId == severityId)
                    .Select(s => s.SeverityName)
                    .FirstOrDefaultAsync();

                var details =
                    $"AllergyId: {allergyId.Value}, " +
                    $"Allergy: {allergyName ?? "Unknown"}, " +
                    $"Severity: {severityName ?? severityId.ToString()}";

                await _logRepo.CreateAddRecordLogAsync(
                    currentUserId.Value,
                    "Allergy",
                    allergyId.Value,
                    details
                );
            }

            return Ok(new { added });
        }

        // PUT: /api/HealthProfileAllergy/10?userId=123&allergyNameId=5&severityId=3
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromQuery] int userId,
            [FromQuery] int allergyNameId,
            [FromQuery] int severityId)
        {
            if (id <= 0 || userId <= 0 || allergyNameId <= 0 || severityId <= 0)
                return BadRequest(new { error = "Invalid parameters" });
            
            var currentUserId = await GetCurrentUserIdAsync();
            if (!currentUserId.HasValue || currentUserId.Value != userId)
                return Forbid();

            var before = await _context.HealthProfileAllergies
                .Include(x => x.Allergy).ThenInclude(a => a.AlleryName)
                .Include(x => x.Severity)
                .Include(x => x.HealthProfile)
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.HealthProfileAllergyId == id &&
                    x.HealthProfile != null &&
                    x.HealthProfile.UserId == userId);

            if (before == null)
                return Ok(new { updated = false });


            var allergyId = await _context.Allergies
                .Where(a => a.AlleryNameId == allergyNameId)
                .Select(a => (int?)a.AllergyId)
                .FirstOrDefaultAsync();

            if (allergyId == null)
                return Ok(new { updated = false });

            var updated = await _repo.UpdateAsync(userId, id, allergyId.Value, severityId);

            if (updated)
            {
                var newAllergyName = await _context.AllergyNames
                    .Where(n => n.AlleryNameId == allergyNameId)
                    .Select(n => n.AllergyName1)
                    .FirstOrDefaultAsync();

                var newSeverityName = await _context.Severities
                    .Where(s => s.SeverityId == severityId)
                    .Select(s => s.SeverityName)
                    .FirstOrDefaultAsync();

                var details =
                    $"HealthProfileAllergyId: {id}, " +
                    $"Allergy: {(before.Allergy?.AlleryName?.AllergyName1 ?? "Unknown")} → {newAllergyName ?? "Unknown"}, " +
                    $"Severity: {(before.Severity?.SeverityName ?? "Unknown")} → {newSeverityName ?? severityId.ToString()}";

                await _logRepo.CreateEditRecordLogAsync(
                    currentUserId.Value,
                    "Allergy",
                    allergyId.Value,
                    details
                );
            }

            return Ok(new { updated });
        }

        // DELETE: /api/HealthProfileAllergy/10?userId=123
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(
            int id,
            [FromQuery] int userId)
        {
            if (id <= 0 || userId <= 0)
                return BadRequest(new { error = "Invalid parameters" });

            var currentUserId = await GetCurrentUserIdAsync();
            if (!currentUserId.HasValue || currentUserId.Value != userId)
                return Forbid();

            // BEFORE (for log)
            var before = await _context.HealthProfileAllergies
                .Include(x => x.Allergy).ThenInclude(a => a.AlleryName)
                .Include(x => x.Severity)
                .Include(x => x.HealthProfile)
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.HealthProfileAllergyId == id &&
                    x.HealthProfile != null &&
                    x.HealthProfile.UserId == userId);

            var removed = await _repo.RemoveAsync(userId, id);

            if (removed && before != null)
            {
                var details =
                    $"HealthProfileAllergyId: {id}, " +
                    $"Allergy: {before.Allergy?.AlleryName?.AllergyName1 ?? "Unknown"}, " +
                    $"Severity: {before.Severity?.SeverityName ?? "Unknown"}";

                await _logRepo.CreateDeleteRecordLogAsync(
                    currentUserId.Value,
                    "Allergy",
                    before.AllergyId ?? 0,
                    details
                );
            }

            return Ok(new { removed });
        }
    }
}
