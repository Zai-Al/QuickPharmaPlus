using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.ModelsDTO.PrescriptionPlan;
using QuickPharmaPlus.Server.Repositories.Implementation;
using QuickPharmaPlus.Server.Repositories.Interface;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;


[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Customer")]
public class PrescriptionPlanController : ControllerBase
{
    private readonly IPrescriptionPlanRepository _repo;
    private readonly IQuickPharmaLogRepository _logRepo;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly QuickPharmaPlusDbContext _context;

    public PrescriptionPlanController(
        IPrescriptionPlanRepository repo,
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
        var userEmail = User?.Identity?.Name;
        if (string.IsNullOrEmpty(userEmail))
            return null;

        var identityUser = await _userManager.FindByEmailAsync(userEmail);
        if (identityUser == null)
            return null;

        var domainUser = await _context.Users
            .FirstOrDefaultAsync(u => u.EmailAddress == userEmail);

        return domainUser?.UserId;
    }


    [HttpGet("user/{userId}/eligible")]
    public async Task<IActionResult> Eligible(int userId)
        => Ok(await _repo.GetEligiblePrescriptionsAsync(userId));

    [HttpGet("user/{userId}/prescription/{prescriptionId}/items")]
    public async Task<IActionResult> Items(int userId, int prescriptionId)
        => Ok(await _repo.GetPlanItemsAsync(userId, prescriptionId));

    [HttpPost("user/{userId}")]
    public async Task<IActionResult> Create(int userId, PrescriptionPlanUpsertDto dto)
    {
        var currentUserId = await GetCurrentUserIdAsync();
        if (!currentUserId.HasValue || currentUserId.Value != userId)
            return Forbid();

        var planId = await _repo.CreateAsync(userId, dto);
        if (!planId.HasValue)
            return BadRequest("Unable to create prescription plan.");

        // build log details
        var details =
            $"PrescriptionId: {dto.PrescriptionId}, " +
            $"Method: {dto.Method}, " +
            $"BranchId: {dto.BranchId}, " +
            $"CityId: {dto.CityId}";

        await _logRepo.CreateAddRecordLogAsync(
            currentUserId.Value,
            "PrescriptionPlan",
            planId.Value,
            details
        );

        return Ok(new { prescriptionPlanId = planId.Value });
    }



    [HttpPut("user/{userId}/{planId}")]
    public async Task<IActionResult> Update(int userId, int planId, PrescriptionPlanUpsertDto dto)
    {
        var currentUserId = await GetCurrentUserIdAsync();
        if (!currentUserId.HasValue || currentUserId.Value != userId)
            return Forbid();

        // load BEFORE state
        var before = await _context.PrescriptionPlans
            .Include(p => p.Shipping)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PrescriptionPlanId == planId && p.UserId == userId);

        if (before == null) return NotFound();

        var success = await _repo.UpdateAsync(userId, planId, dto);
        if (!success) return BadRequest("Unable to update plan.");

        // detect changes
        var changes = new List<string>();

        if (before.Shipping?.ShippingIsDelivery != (dto.Method == "delivery"))
            changes.Add($"Method: {(before.Shipping?.ShippingIsDelivery == true ? "delivery" : "pickup")} → {dto.Method}");

        if (before.Shipping?.BranchId != dto.BranchId)
            changes.Add($"BranchId: {before.Shipping?.BranchId} → {dto.BranchId}");

        if (dto.CityId.HasValue)
            changes.Add($"CityId: {dto.CityId}");

        var details = changes.Any()
            ? $"Updated prescription plan. {string.Join(", ", changes)}"
            : "Updated prescription plan.";

        await _logRepo.CreateEditRecordLogAsync(
            currentUserId.Value,
            "PrescriptionPlan",
            planId,
            details
        );

        return Ok(new { updated = true });
    }


    [HttpDelete("user/{userId}/{planId}")]
    public async Task<IActionResult> Delete(int userId, int planId)
    {
        var currentUserId = await GetCurrentUserIdAsync();
        if (!currentUserId.HasValue || currentUserId.Value != userId)
            return Forbid();

        var plan = await _context.PrescriptionPlans
            .Include(p => p.Approval)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PrescriptionPlanId == planId && p.UserId == userId);

        if (plan == null) return NotFound();

        var success = await _repo.DeleteAsync(userId, planId);
        if (!success) return BadRequest("Unable to delete plan.");

        var details =
            $"PrescriptionId: {plan.Approval?.PrescriptionId}, " +
            $"Product: {plan.Approval?.ApprovalProductName}";

        await _logRepo.CreateDeleteRecordLogAsync(
            currentUserId.Value,
            "PrescriptionPlan",
            planId,
            details
        );

        return Ok(new { deleted = true });
    }


    [HttpGet("user/{userId}/plans")]
    public async Task<IActionResult> GetUserPlans(int userId)
    {
        var plans = await _repo.GetUserPlansAsync(userId);
        return Ok(plans);
    }

    [HttpGet("user/{userId}/plans/{planId}")]
    public async Task<IActionResult> GetPlanDetails(int userId, int planId)
    {
        var plan = await _repo.GetPlanDetailsAsync(planId, userId);
        if (plan == null) return NotFound("Plan not found.");
        return Ok(plan);
    }

}
