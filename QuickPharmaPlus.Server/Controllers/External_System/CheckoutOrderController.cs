using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.ModelsDTO.CheckoutOrder;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class CheckoutOrderController : ControllerBase
    {
        private readonly ICheckoutOrderRepository _repo;

        public CheckoutOrderController(ICheckoutOrderRepository repo)
        {
            _repo = repo;
        }

        // POST /api/CheckoutOrder/create
        // Must be [FromForm] because it can include uploaded files
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromForm] CheckoutCreateOrderRequestDto req)
        {
            var result = await _repo.CreateOrderFromCheckoutAsync(req);
            if (!result.Created) return Conflict(result);
            return Ok(result);
        }
    }
}
