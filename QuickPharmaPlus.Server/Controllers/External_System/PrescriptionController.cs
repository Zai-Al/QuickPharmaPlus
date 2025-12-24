using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Prescription;
using QuickPharmaPlus.Server.ModelsDTO.Prescription.Checkout;
using QuickPharmaPlus.Server.Repositories.Interface;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Identity;


namespace QuickPharmaPlus.Server.Controllers.External_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Customer")]
    public class PrescriptionController : ControllerBase
    {
        private readonly IPrescriptionRepository _repo;
        private readonly ILogger<PrescriptionController> _logger;
        private readonly IQuickPharmaLogRepository _logRepo;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly QuickPharmaPlusDbContext _context;

        public PrescriptionController(
            IPrescriptionRepository repo,
            ILogger<PrescriptionController> logger,
            IQuickPharmaLogRepository logRepo,
            UserManager<ApplicationUser> userManager,
            QuickPharmaPlusDbContext context)
        {
            _repo = repo;
            _logger = logger;
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


        [HttpGet("ping")]
        public IActionResult Ping() => Ok(new { ok = true, where = "PrescriptionController" });

        
        // GET: /api/Prescription/user/5/health
        [HttpGet("user/{userId:int}/health")]
        public async Task<IActionResult> GetUserHealthPrescriptions(int userId)
        {
            try
            {
                if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

                var items = await _repo.GetUserHealthPrescriptionsAsync(userId);
                return Ok(items ?? new List<PrescriptionListDto>());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetUserHealthPrescriptions (user:{user})", userId);
                return StatusCode(500, new
                {
                    error = "An unexpected error occurred while loading prescriptions.",
                    message = ex.Message
#if DEBUG
                    ,
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // POST: /api/Prescription/user/5 (multipart/form-data)
        [HttpPost("user/{userId:int}")]
        [RequestSizeLimit(25_000_000)]
        public async Task<IActionResult> Create(int userId, [FromForm] PrescriptionCreateDto dto)
        {
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            // must match logged-in user
            var currentUserId = await GetCurrentUserIdAsync();
            if (!currentUserId.HasValue || currentUserId.Value != userId)
                return Forbid();

            var newId = await _repo.CreateAsync(userId, dto);
            if (newId <= 0) return BadRequest(new { error = "Invalid prescription data" });

            // log add
            await _logRepo.CreateAddRecordLogAsync(
                userId: currentUserId.Value,
                tableName: "Prescription",
                recordId: newId,
                details: $"Customer created prescription. Name: {dto?.PrescriptionName ?? "N/A"}"
                + $" IsHealthProfile: {dto?.IsHealthPerscription.ToString() ?? "N/A"}"
                + $" CityId: {dto?.CityId.ToString() ?? "N/A"}"
                + $" Block: {dto?.Block ?? "N/A"}"
                + $" Road: {dto?.Road ?? "N/A"}"
                + $" BuildingFloor: {dto?.BuildingFloor ?? "N/A"}"
                + $" Has PrescriptionDocument: {(dto?.PrescriptionDocument != null ? "Yes" : "No")}"
                + $" Has PrescriptionCprDocument: {(dto?.PrescriptionCprDocument != null ? "Yes" : "No")}"
            );

            return Ok(new { message = "Prescription created successfully.", prescriptionId = newId });
        }


        // PUT: /api/Prescription/user/5/123 (multipart/form-data)
        [HttpPut("user/{userId:int}/{prescriptionId:int}")]
        [RequestSizeLimit(25_000_000)]
        public async Task<IActionResult> Update(int userId, int prescriptionId, [FromForm] PrescriptionUpdateDto dto)
        {
            if (userId <= 0 || prescriptionId <= 0) return BadRequest(new { error = "Invalid ids" });

            var currentUserId = await GetCurrentUserIdAsync();
            if (!currentUserId.HasValue || currentUserId.Value != userId)
                return Forbid();

            var ok = await _repo.UpdateAsync(userId, prescriptionId, dto);
            if (!ok) return NotFound(new { error = "Prescription not found (or invalid address)." });

            await _logRepo.CreateEditRecordLogAsync(
                userId: currentUserId.Value,
                tableName: "Prescription",
                recordId: prescriptionId,
                details: $"Customer updated prescription. Name: {dto?.PrescriptionName ?? "N/A"}"
                + $" IsHealthProfile: {dto?.IsHealthPerscription.ToString() ?? "N/A"}"
                + $" CityId: {dto?.CityId.ToString() ?? "N/A"}"
                + $" Block: {dto?.Block ?? "N/A"}"
                + $" Road: {dto?.Road ?? "N/A"}"
                + $" BuildingFloor: {dto?.BuildingFloor ?? "N/A"}"
                + $" Has PrescriptionDocument: {(dto?.PrescriptionDocument != null ? "Yes" : "No")}"
                + $" Has PrescriptionCprDocument: {(dto?.PrescriptionCprDocument != null ? "Yes" : "No")}"
            );

            return Ok(new { message = "Prescription updated successfully." });
        }


        // DELETE: /api/Prescription/user/5/123
        [HttpDelete("user/{userId:int}/{prescriptionId:int}")]
        public async Task<IActionResult> Delete(int userId, int prescriptionId)
        {
            if (userId <= 0 || prescriptionId <= 0) return BadRequest(new { error = "Invalid ids" });

            var currentUserId = await GetCurrentUserIdAsync();
            if (!currentUserId.HasValue || currentUserId.Value != userId)
                return Forbid();

            var ok = await _repo.DeleteAsync(userId, prescriptionId);
            if (!ok) return NotFound(new { error = "Prescription not found." });

            await _logRepo.CreateDeleteRecordLogAsync(
                userId: currentUserId.Value,
                tableName: "Prescription",
                recordId: prescriptionId,
                details: $"Customer deleted prescription."
            );

            return Ok(new { message = "Prescription deleted successfully." });
        }


        [HttpGet("user/{userId:int}/{prescriptionId:int}/document")]
        public async Task<IActionResult> GetDocument(int userId, int prescriptionId)
        {
            var doc = await _repo.GetPrescriptionDocumentAsync(userId, prescriptionId);
            if (doc == null) return NotFound(new { error = "Prescription document not found." });

            // inline (opens in browser)
            Response.Headers["Content-Disposition"] = "inline";

            return File(doc.Value.bytes, doc.Value.contentType);
        }

        [HttpGet("user/{userId:int}/{prescriptionId:int}/cpr")]
        public async Task<IActionResult> GetCpr(int userId, int prescriptionId)
        {
            var doc = await _repo.GetCprDocumentAsync(userId, prescriptionId);
            if (doc == null) return NotFound(new { error = "CPR document not found." });

            // inline (opens in browser)
            Response.Headers["Content-Disposition"] = "inline";

            return File(doc.Value.bytes, doc.Value.contentType);
        }

        // POST: /api/Prescription/checkout/5 (multipart/form-data)
        [HttpPost("checkout/{userId:int}")]
        [RequestSizeLimit(25_000_000)]
        public async Task<IActionResult> CreateCheckout(int userId, [FromForm] PrescriptionCreateDto dto)
        {
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            var currentUserId = await GetCurrentUserIdAsync();
            if (!currentUserId.HasValue || currentUserId.Value != userId)
                return Forbid();

            var newId = await _repo.CreateCheckoutAsync(userId, dto);
            if (newId <= 0) return BadRequest(new { error = "Invalid prescription data" });

            await _logRepo.CreateAddRecordLogAsync(
                userId: currentUserId.Value,
                tableName: "Prescription",
                recordId: newId,
                details: $"Customer created checkout prescription. Name: {dto?.PrescriptionName ?? "N/A"}" 
                + $" IsHealthProfile: {dto?.IsHealthPerscription.ToString() ?? "N/A"}"
                + $" CityId: {dto?.CityId.ToString() ?? "N/A"}" 
                + $" Block: {dto?.Block ?? "N/A"}" 
                + $" Road: {dto?.Road ?? "N/A"}" 
                + $" BuildingFloor: {dto?.BuildingFloor ?? "N/A"}"
                + $" Has PrescriptionDocument: {(dto?.PrescriptionDocument != null ? "Yes" : "No")}"
                + $" Has PrescriptionCprDocument: {(dto?.PrescriptionCprDocument != null ? "Yes" : "No")}"
            );

            return Ok(new { message = "Checkout prescription created successfully.", prescriptionId = newId });
        }


        [HttpPost("checkout/validate")]
        public async Task<IActionResult> ValidateCheckoutPrescription(
            [FromBody] CheckoutPrescriptionValidateRequestDto dto
        )
        {
            if (dto == null) return BadRequest("INVALID_BODY");

            var result = await _repo.ValidateCheckoutPrescriptionAsync(
                dto.UserId,
                dto.PrescriptionId,
                dto.CartItems,
                dto.IsHealthProfile
            );

            return Ok(result);
        }

        // GET: /api/Prescription/user/5/123
        [HttpGet("user/{userId:int}/{prescriptionId:int}")]
        public async Task<IActionResult> GetById(int userId, int prescriptionId)
        {
            try
            {
                if (userId <= 0 || prescriptionId <= 0) return BadRequest(new { error = "Invalid ids" });

                var item = await _repo.GetUserHealthPrescriptionByIdAsync(userId, prescriptionId);
                if (item == null) return NotFound(new { error = "Prescription not found." });

                return Ok(item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetById (user:{user}, prescription:{prescription})", userId, prescriptionId);
                return StatusCode(500, new { error = "Unexpected error.", message = ex.Message });
            }
        }

        private static string GetExtensionFromContentType(string? ct)
        {
            ct = (ct ?? "").ToLowerInvariant().Trim();
            return ct switch
            {
                "application/pdf" => ".pdf",
                "image/jpeg" => ".jpg",
                "image/png" => ".png",
                _ => ""
            };
        }
    }
}
