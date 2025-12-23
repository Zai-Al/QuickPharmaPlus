using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class ReportTypesController : ControllerBase
    {
        private readonly IReportRepository _repo;

        public ReportTypesController(IReportRepository repo)
        {
            _repo = repo;
        }

        // GET: api/ReportTypes
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var items = await _repo.GetReportTypesAsync();
            return Ok(new { items });
        }
    }
}