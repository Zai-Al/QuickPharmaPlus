using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.External_System
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class HealthProfileLookupController : ControllerBase
    {
        private readonly IHealthProfileLookupRepository _repo;

        public HealthProfileLookupController(IHealthProfileLookupRepository repo)
        {
            _repo = repo;
        }

        [HttpGet("illnessNames")]
        public async Task<IActionResult> GetIllnessNames([FromQuery] int? userId, [FromQuery] int? includeIllnessNameId)
        {
            var items = await _repo.GetIllnessNamesAsync(userId, includeIllnessNameId);
            return Ok(new { count = items.Count, items });
        }

        [HttpGet("allergyNames")]
        public async Task<IActionResult> GetAllergyNames([FromQuery] int? userId, [FromQuery] int? includeAllergyNameId)
        {
            var items = await _repo.GetAllergyNamesAsync(userId, includeAllergyNameId);
            return Ok(new { count = items.Count, items });
        }



        [HttpGet("severities")]
        public async Task<IActionResult> GetSeverities()
        {
            try
            {
                var items = await _repo.GetSeveritiesAsync();
                return Ok(new { count = items.Count, items });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Severity lookup failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }
    }
}
