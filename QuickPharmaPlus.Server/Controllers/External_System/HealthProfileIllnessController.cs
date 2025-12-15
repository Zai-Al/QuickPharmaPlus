using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.External_System
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous] // later: [Authorize(Roles="Customer")]
    public class HealthProfileIllnessController : ControllerBase
    {
        private readonly IHealthProfileIllnessRepository _repo;
        private readonly QuickPharmaPlusDbContext _context;

        public HealthProfileIllnessController(
            IHealthProfileIllnessRepository repo,
            QuickPharmaPlusDbContext context)
        {
            _repo = repo;
            _context = context;
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
                // resolve illnessId from name+severity
                var illnessId = await _context.Illnesses
                    .Where(i => i.IllnessNameId == illnessNameId)
                    .Select(i => (int?)i.IllnessId)
                    .FirstOrDefaultAsync();

                if (illnessId == null)
                    return Ok(new { added = false });

                var added = await _repo.AddAsync(userId, illnessId.Value, severityId);
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
                // resolve illnessId from name+severity
                var illnessId = await _context.Illnesses
                    .Where(i => i.IllnessNameId == illnessNameId)
                    .Select(i => (int?)i.IllnessId)
                    .FirstOrDefaultAsync();

                if (illnessId == null)
                    return Ok(new { updated = false });

                var updated = await _repo.UpdateAsync(userId, healthProfileIllnessId, illnessId.Value, severityId);
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
                var removed = await _repo.RemoveAsync(userId, healthProfileIllnessId);
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
