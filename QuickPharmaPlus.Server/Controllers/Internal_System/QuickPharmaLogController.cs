using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    public class QuickPharmaLogController : ControllerBase
    {
        private readonly IQuickPharmaLogRepository _repo;

        public QuickPharmaLogController(IQuickPharmaLogRepository repo)
        {
            _repo = repo;
        }

        // ============================================
        // GET: api/QuickPharmaLog
        // RESTRICTED: Only Admin & Manager can VIEW logs
        // ============================================
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] int? logTypeId = null,
            [FromQuery] string? employeeName = null,
            [FromQuery] DateOnly? actionDate = null)
        {
            // Validate Log ID search (numbers only)
            if (!string.IsNullOrWhiteSpace(search))
            {
                if (!Regex.IsMatch(search, @"^[0-9]*$"))
                {
                    ModelState.AddModelError("search", "Log ID must contain numbers only.");
                    return BadRequest(ModelState);
                }
            }

            // Validate action date
            if (actionDate.HasValue)
            {
                if (actionDate.Value.Year < 2000 || actionDate.Value.Year > 2100)
                {
                    ModelState.AddModelError("actionDate", "Invalid action date.");
                    return BadRequest(ModelState);
                }
            }

            var result = await _repo.GetAllQuickPharmaLogsAsync(
                pageNumber,
                pageSize,
                search,
                logTypeId,
                employeeName,
                actionDate);

            return Ok(new
            {
                items = result.Items,
                totalCount = result.TotalCount,
                pageNumber,
                pageSize
            });
        }

        // ============================================
        // GET: api/QuickPharmaLog/types
        // RESTRICTED: Only Admin & Manager can VIEW log types
        // ============================================
        [HttpGet("types")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetLogTypes()
        {
            var types = await _repo.GetAllLogTypesAsync();
            return Ok(types);
        }

        // ============================================
        // INTERNAL LOG CREATION ENDPOINTS
        // These are called by OTHER controllers/services
        // NO AUTHORIZATION needed (server-side only calls)
        // ============================================

        /// <summary>
        /// Creates an inventory change log.
        /// Called internally when inventory is modified.
        /// </summary>
        [HttpPost("internal/inventory-change")]
        [AllowAnonymous] // Internal use - called from server code
        public async Task<IActionResult> LogInventoryChange(
            [FromQuery] int? userId,
            [FromQuery] string? productName,
            [FromQuery] string? branchName)
        {
            try
            {
                await _repo.CreateInventoryChangeLogAsync(userId, productName, branchName);
                return Ok(new { logged = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create inventory change log", details = ex.Message });
            }
        }

        /// <summary>
        /// Creates a login failure log.
        /// Called internally when user fails to login 3 times.
        /// </summary>
        [HttpPost("internal/login-failure")]
        [AllowAnonymous] // Internal use
        public async Task<IActionResult> LogLoginFailure([FromQuery] string email)
        {
            try
            {
                await _repo.CreateLoginFailureLogAsync(email);
                return Ok(new { logged = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create login failure log", details = ex.Message });
            }
        }

        /// <summary>
        /// Creates an add record log.
        /// Called internally when a record is added.
        /// </summary>
        [HttpPost("internal/add-record")]
        [AllowAnonymous] // Internal use
        public async Task<IActionResult> LogAddRecord([FromQuery] int userId, [FromQuery] string tableName)
        {
            try
            {
                await _repo.CreateAddRecordLogAsync(userId, tableName);
                return Ok(new { logged = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create add record log", details = ex.Message });
            }
        }

        /// <summary>
        /// Creates an edit record log.
        /// Called internally when a record is edited.
        /// </summary>
        [HttpPost("internal/edit-record")]
        [AllowAnonymous] // Internal use
        public async Task<IActionResult> LogEditRecord([FromQuery] int userId, [FromQuery] string tableName)
        {
            try
            {
                await _repo.CreateEditRecordLogAsync(userId, tableName);
                return Ok(new { logged = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create edit record log", details = ex.Message });
            }
        }

        /// <summary>
        /// Creates a delete record log.
        /// Called internally when a record is deleted.
        /// </summary>
        [HttpPost("internal/delete-record")]
        [AllowAnonymous] // Internal use
        public async Task<IActionResult> LogDeleteRecord([FromQuery] int userId, [FromQuery] string tableName)
        {
            try
            {
                await _repo.CreateDeleteRecordLogAsync(userId, tableName);
                return Ok(new { logged = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create delete record log", details = ex.Message });
            }
        }

        /// <summary>
        /// Creates a prescription approval log.
        /// Called internally when a prescription is approved.
        /// </summary>
        [HttpPost("internal/prescription-approval")]
        [AllowAnonymous] // Internal use
        public async Task<IActionResult> LogPrescriptionApproval([FromQuery] int userId, [FromQuery] int prescriptionId)
        {
            try
            {
                await _repo.CreatePrescriptionApprovalLogAsync(userId, prescriptionId);
                return Ok(new { logged = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create prescription approval log", details = ex.Message });
            }
        }

        /// <summary>
        /// Creates a controlled product dispensed log.
        /// Called internally when a controlled medication is dispensed.
        /// </summary>
        [HttpPost("internal/controlled-dispensed")]
        [AllowAnonymous] // Internal use
        public async Task<IActionResult> LogControlledProductDispensed(
            [FromQuery] int userId,
            [FromQuery] string productName,
            [FromQuery] int prescriptionId)
        {
            try
            {
                await _repo.CreateControlledProductDispensedLogAsync(userId, productName, prescriptionId);
                return Ok(new { logged = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to create controlled product dispensed log", details = ex.Message });
            }
        }
    }
}