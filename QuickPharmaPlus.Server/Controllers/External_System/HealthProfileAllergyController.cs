using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // REQUIRED for FirstOrDefaultAsync
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.External_System
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthProfileAllergyController : ControllerBase
    {
        private readonly IHealthProfileAllergyRepository _repo;
        private readonly QuickPharmaPlusDbContext _context;

        public HealthProfileAllergyController(
            IHealthProfileAllergyRepository repo,
            QuickPharmaPlusDbContext context)
        {
            _repo = repo;
            _context = context;
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

            // IMPORTANT: scaffolded column name is AlleryNameId
            var allergyId = await _context.Allergies
                .Where(a => a.AlleryNameId == allergyNameId)
                .Select(a => (int?)a.AllergyId)
                .FirstOrDefaultAsync();

            if (allergyId == null)
                return Ok(new { added = false });

            var added = await _repo.AddAsync(userId, allergyId.Value, severityId);
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

            var allergyId = await _context.Allergies
                .Where(a => a.AlleryNameId == allergyNameId)
                .Select(a => (int?)a.AllergyId)
                .FirstOrDefaultAsync();

            if (allergyId == null)
                return Ok(new { updated = false });

            var updated = await _repo.UpdateAsync(userId, id, allergyId.Value, severityId);
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

            var removed = await _repo.RemoveAsync(userId, id);
            return Ok(new { removed });
        }
    }
}
