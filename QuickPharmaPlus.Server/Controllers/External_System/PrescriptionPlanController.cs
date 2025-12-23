using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.ModelsDTO.PrescriptionPlan;
using QuickPharmaPlus.Server.Repositories.Implementation;
using QuickPharmaPlus.Server.Repositories.Interface;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Customer")]
public class PrescriptionPlanController : ControllerBase
{
    private readonly IPrescriptionPlanRepository _repo;

    public PrescriptionPlanController(IPrescriptionPlanRepository repo)
    {
        _repo = repo;
    }

    [HttpGet("user/{userId}/eligible")]
    public async Task<IActionResult> Eligible(int userId)
        => Ok(await _repo.GetEligiblePrescriptionsAsync(userId));

    [HttpGet("user/{userId}/prescription/{prescriptionId}/items")]
    public async Task<IActionResult> Items(int userId, int prescriptionId)
        => Ok(await _repo.GetPlanItemsAsync(userId, prescriptionId));

    [HttpPost("user/{userId}")]
    public async Task<IActionResult> Create(int userId, PrescriptionPlanUpsertDto dto)
        => Ok(await _repo.CreateAsync(userId, dto));

    [HttpPut("user/{userId}/{planId}")]
    public async Task<IActionResult> Update(int userId, int planId, PrescriptionPlanUpsertDto dto)
        => Ok(await _repo.UpdateAsync(userId, planId, dto));

    [HttpDelete("user/{userId}/{planId}")]
    public async Task<IActionResult> Delete(int userId, int planId)
        => Ok(await _repo.DeleteAsync(userId, planId));

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
