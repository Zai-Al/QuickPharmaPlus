using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.ModelsDTO.Order;
using QuickPharmaPlus.Server.Repositories.Interface;
using QuickPharmaPlus.Server.Services;

namespace QuickPharmaPlus.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MyOrdersController : ControllerBase
    {
        private readonly IOrderRepository _orders;
        private readonly IOrderEmailService _orderEmail;

        public MyOrdersController(IOrderRepository orders, IOrderEmailService orderEmail)
        {
            _orders = orders;
            _orderEmail = orderEmail;
        }

        // GET api/MyOrders?userId=1&pageNumber=1&pageSize=10&statusId=2&search=123&sortBy=date-desc
        [HttpGet]
        public async Task<IActionResult> GetMyOrders(
            [FromQuery] int userId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] int? statusId = null,
            [FromQuery] DateTime? dateFrom = null,
            [FromQuery] DateTime? dateTo = null,
            [FromQuery] string? sortBy = null)
        {
            var res = await _orders.GetMyOrdersAsync(userId, pageNumber, pageSize, search, statusId, dateFrom, dateTo, sortBy);
            return Ok(res);
        }

        // GET api/MyOrders/123?userId=1
        [HttpGet("{orderId:int}")]
        public async Task<IActionResult> GetMyOrderDetails([FromRoute] int orderId, [FromQuery] int userId)
        {
            var dto = await _orders.GetMyOrderDetailsAsync(userId, orderId);
            if (dto == null) return NotFound();
            return Ok(dto);
        }

        [HttpGet("{orderId:int}/reschedule-options")]
        public async Task<ActionResult<OrderRescheduleOptionsDto>> GetRescheduleOptions(int orderId, [FromQuery] int userId)
        {
            var opt = await _orders.GetRescheduleOptionsAsync(userId, orderId);
            if (opt == null) return NotFound();
            return Ok(opt);
        }

        [HttpPost("{orderId:int}/reschedule")]
        public async Task<IActionResult> Reschedule(int orderId, [FromBody] OrderRescheduleRequestDto req)
        {
            var ok = await _orders.RescheduleDeliveryAsync(req.UserId, orderId, req.ShippingDate, req.SlotId);
            if (!ok) return BadRequest("Unable to reschedule. Slot might be full or outside allowed dates.");

            // Send rescheduled email (same template, different title/text)
            await _orderEmail.TrySendOrderRescheduledEmailAsync(orderId, req.UserId);

            return Ok(new { updated = true });
        }
    }
}
