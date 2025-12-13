using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BranchController : ControllerBase
    {
        private readonly IBranchRepository _branchRepository;

        public BranchController(IBranchRepository branchRepository)
        {
            _branchRepository = branchRepository;
        }

        // GET: api/Branch?pageNumber=1&pageSize=10&search=manama
        [HttpGet]
        public async Task<IActionResult> GetAllBranches(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null)
        {
            var result = await _branchRepository.GetAllBranchesAsync(pageNumber, pageSize, search);
            return Ok(result);
        }
    }
}
