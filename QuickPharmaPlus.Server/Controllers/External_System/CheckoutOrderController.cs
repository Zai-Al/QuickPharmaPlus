using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.CheckoutOrder;
using QuickPharmaPlus.Server.Repositories.Interface;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class CheckoutOrderController : ControllerBase
    {
        private readonly ICheckoutOrderRepository _repo;
        private readonly IQuickPharmaLogRepository _logRepo;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly QuickPharmaPlusDbContext _context;

        public CheckoutOrderController(
            ICheckoutOrderRepository repo,
            IQuickPharmaLogRepository logRepo,
            UserManager<ApplicationUser> userManager,
            QuickPharmaPlusDbContext context)
        {
            _repo = repo;
            _logRepo = logRepo;
            _userManager = userManager;
            _context = context;
        }

        private async Task<int?> GetCurrentUserIdAsync()
        {
            var email = User?.Identity?.Name;
            if (string.IsNullOrWhiteSpace(email)) return null;

            var domainUser = await _context.Users.FirstOrDefaultAsync(u => u.EmailAddress == email);
            return domainUser?.UserId;
        }


        // POST /api/CheckoutOrder/create
        // Must be [FromForm] because it can include uploaded files
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromForm] CheckoutCreateOrderRequestDto req)
        {
            var currentUserId = await GetCurrentUserIdAsync();
            if (!currentUserId.HasValue || currentUserId.Value != req.UserId)
                return Forbid();

            var result = await _repo.CreateOrderFromCheckoutAsync(req);
            if (!result.Created) return Conflict(result);

            var details =
        $"Order created from checkout. " +
        $"OrderId: {result.OrderId}, ShippingId: {result.ShippingId}, " +
        $"Payment: {(req.PaymentMethod ?? "N/A")}, " +
        $"Mode: {(req.Mode ?? "N/A")}, BranchId: {req.PickupBranchId}";

            await _logRepo.CreateAddRecordLogAsync(
                userId: currentUserId.Value,
                tableName: "Order",
                recordId: result.OrderId.Value,
                details: details
            );

            // log inventory changes for each item

            await _logRepo.CreateInventoryChangeLogAsync(
        userId: currentUserId.Value,
        productName: "Order checkout (multiple items)",
        branchId: req.PickupBranchId
    );

            return Ok(result);
        }
    }
}
