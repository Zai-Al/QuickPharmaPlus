using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Security.Claims;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Manager")]
    public class ManagerDashboardController : ControllerBase
    {
        private readonly IManagerDashboardRepository _repo;
        private readonly QuickPharmaPlusDbContext _context;

        public ManagerDashboardController(IManagerDashboardRepository repo, QuickPharmaPlusDbContext context)
        {
            _repo = repo;
            _context = context;
        }

        // GET: api/ManagerDashboard
        [HttpGet]
        public async Task<IActionResult> GetDashboardData()
        {
            try
            {
                // Get the logged-in user's email from Identity claims
                var userEmail = User.FindFirstValue(ClaimTypes.Email);
                
                if (string.IsNullOrEmpty(userEmail))
                {
                    return Unauthorized(new { error = "User email not found in claims." });
                }

                // Find the user in the User table by email
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.EmailAddress == userEmail);

                if (user == null)
                {
                    return NotFound(new { error = "User not found in database." });
                }

                // Check if user has a branch assigned
                if (!user.BranchId.HasValue)
                {
                    return BadRequest(new { error = "Manager does not have a branch assigned." });
                }

                var branchId = user.BranchId.Value;

                // Fetch dashboard data for this specific branch
                var data = await _repo.GetManagerDashboardDataAsync(branchId);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { error = "An error occurred while retrieving dashboard data.", details = ex.Message });
            }
        }
    }
}