using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.ModelsDTO.Delivery;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Driver")]
    public class DeliveryRequestsController : ControllerBase
    {
        private readonly IDeliveryRequestRepository _repo;

        public DeliveryRequestsController(IDeliveryRequestRepository repo)
        {
            _repo = repo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] int? orderId = null,
            [FromQuery] int? statusId = null,
            [FromQuery] int? paymentMethodId = null,
            [FromQuery] bool? isUrgent = null)
        {
            var identityUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(identityUserId))
                return Unauthorized();

            var isAdmin = User.IsInRole("Admin");

            var result = await _repo.GetDeliveryRequestsAsync(
                identityUserId,
                isAdmin,
                pageNumber,
                pageSize,
                orderId,
                statusId,
                paymentMethodId,
                isUrgent);

            return Ok(result);
        }

        [HttpPut("{orderId:int}/status")]
        public async Task<IActionResult> UpdateStatus(int orderId, [FromBody] UpdateDeliveryStatusRequestDto dto, CancellationToken ct)
        {
            var identityUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(identityUserId))
                return Unauthorized();

            var isAdmin = User.IsInRole("Admin");

            var ok = await _repo.UpdateDeliveryStatusAsync(identityUserId, isAdmin, orderId, dto, ct);
            if (!ok) return BadRequest(new { updated = false });

            return Ok(new { updated = true });
        }
    }
}