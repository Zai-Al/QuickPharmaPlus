using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Order;
using QuickPharmaPlus.Server.Repositories.Interface;
using QuickPharmaPlus.Server.Services;

namespace QuickPharmaPlus.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class MyOrdersController : ControllerBase
    {
        private readonly IOrderRepository _orders;
        private readonly IOrderEmailService _orderEmail;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly QuickPharmaPlusDbContext _context;
        private readonly IQuickPharmaLogRepository _logRepo;

        public MyOrdersController(IOrderRepository orders, IOrderEmailService orderEmail, UserManager<ApplicationUser> userManager,
    QuickPharmaPlusDbContext context, IQuickPharmaLogRepository logRepo)
        {
            _orders = orders;
            _orderEmail = orderEmail;
            _userManager = userManager;
            _context = context;
            _logRepo = logRepo;
        }

        private async Task<int?> GetCurrentUserIdAsync()
        {
            var email = User?.Identity?.Name;
            if (string.IsNullOrWhiteSpace(email)) return null;

            var domainUser = await _context.Users.FirstOrDefaultAsync(u => u.EmailAddress == email);
            return domainUser?.UserId;
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
            var currentUserId = await GetCurrentUserIdAsync();
            if (!currentUserId.HasValue || currentUserId.Value != req.UserId)
                return Forbid();

            // BEFORE (for log)
            var before = await _orders.GetMyOrderDetailsAsync(req.UserId, orderId);

            var ok = await _orders.RescheduleDeliveryAsync(req.UserId, orderId, req.ShippingDate, req.SlotId);
            if (!ok) return BadRequest("Unable to reschedule. Slot might be full or outside allowed dates.");

            // Send rescheduled email (same template, different title/text)
            await _orderEmail.TrySendOrderRescheduledEmailAsync(orderId, req.UserId);

            var details =
        $"Order rescheduled. " +
        $"Date: {before?.ShippingDate?.ToString("yyyy-MM-dd") ?? "N/A"} → {req.ShippingDate:yyyy-MM-dd}, " +
        $"SlotId: {before?.SlotId?.ToString() ?? "N/A"} → {req.SlotId}";

            await _logRepo.CreateEditRecordLogAsync(
                userId: currentUserId.Value,
                tableName: "Order",
                recordId: orderId,
                details: details
            );

            return Ok(new { updated = true });
        }
    }
}
