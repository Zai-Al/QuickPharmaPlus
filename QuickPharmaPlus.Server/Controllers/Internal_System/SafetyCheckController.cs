using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.ModelsDTO.SafetyCheck;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Pharmacist,Manager")]
    public class SafetyCheckController : ControllerBase
    {
        private readonly ISafetyCheckRepository _repo;

        public SafetyCheckController(ISafetyCheckRepository repo)
        {
            _repo = repo;
        }

        [HttpPost("check-interaction")]
        public async Task<IActionResult> CheckInteraction([FromBody] InteractionCheckRequestDto request)
        {
            if (request.ProductAId <= 0 || request.ProductBId <= 0)
                return BadRequest("Invalid product IDs.");

            if (request.ProductAId == request.ProductBId)
                return BadRequest("Please select two different products.");

            var result = await _repo.CheckProductInteractionsAsync(request.ProductAId, request.ProductBId);
            return Ok(result);
        }
    }
}