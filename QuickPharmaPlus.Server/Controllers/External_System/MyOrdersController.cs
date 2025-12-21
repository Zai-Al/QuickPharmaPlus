using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MyOrdersController : ControllerBase
    {
        private readonly IOrderRepository _orders;

        public MyOrdersController(IOrderRepository orders)
        {
            _orders = orders;
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
    }
}
