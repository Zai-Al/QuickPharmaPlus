using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.ModelsDTO.Checkout;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class CheckoutShippingController : ControllerBase
    {
        private readonly IShippingRepository _shippingRepo;
        private readonly IOrderRepository _orderRepo;

        public CheckoutShippingController(IShippingRepository shippingRepo, IOrderRepository orderRepo)
        {
            _shippingRepo = shippingRepo;
            _orderRepo = orderRepo;
        }


        // POST: api/CheckoutShipping/validate
        [HttpPost("validate")]
        public async Task<IActionResult> Validate([FromBody] CheckoutShippingRequestDto req)
        {
            var result = await _shippingRepo.ValidateShippingAsync(req);
            return Ok(result);
        }

        // GET: api/CheckoutShipping/slots?branchId=1&daysAhead=6
        [HttpGet("slots")]
        public async Task<IActionResult> Slots([FromQuery] int branchId, [FromQuery] int daysAhead = 6)
        {
            var result = await _orderRepo.GetAvailableDeliverySlotsAsync(branchId, daysAhead);
            return Ok(result);
        }

        // GET: api/CheckoutShipping/urgent?branchId=1
        [HttpGet("urgent")]
        public async Task<IActionResult> Urgent([FromQuery] int branchId)
        {
            var result = await _orderRepo.GetUrgentAvailabilityAsync(branchId);
            return Ok(result);
        }


    }
}
