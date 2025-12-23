using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Prescription;
using QuickPharmaPlus.Server.ModelsDTO.Prescription.Checkout;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.External_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Customer")]
    public class PrescriptionController : ControllerBase
    {
        private readonly IPrescriptionRepository _repo;
        private readonly ILogger<PrescriptionController> _logger;

        public PrescriptionController(IPrescriptionRepository repo, ILogger<PrescriptionController> logger)
        {
            _repo = repo;
            _logger = logger;
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

            var newId = await _repo.CreateAsync(userId, dto);
            if (newId <= 0) return BadRequest(new { error = "Invalid prescription data" });

            return Ok(new { message = "Prescription created successfully.", prescriptionId = newId });
        }

        // PUT: /api/Prescription/user/5/123 (multipart/form-data)
        [HttpPut("user/{userId:int}/{prescriptionId:int}")]
        [RequestSizeLimit(25_000_000)]
        public async Task<IActionResult> Update(int userId, int prescriptionId, [FromForm] PrescriptionUpdateDto dto)
        {
            if (userId <= 0 || prescriptionId <= 0) return BadRequest(new { error = "Invalid ids" });

            var ok = await _repo.UpdateAsync(userId, prescriptionId, dto);
            if (!ok) return NotFound(new { error = "Prescription not found (or invalid address)." });

            return Ok(new { message = "Prescription updated successfully." });
        }

        // DELETE: /api/Prescription/user/5/123
        [HttpDelete("user/{userId:int}/{prescriptionId:int}")]
        public async Task<IActionResult> Delete(int userId, int prescriptionId)
        {
            if (userId <= 0 || prescriptionId <= 0) return BadRequest(new { error = "Invalid ids" });

            var ok = await _repo.DeleteAsync(userId, prescriptionId);
            if (!ok) return NotFound(new { error = "Prescription not found." });

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

            var newId = await _repo.CreateCheckoutAsync(userId, dto);
            if (newId <= 0) return BadRequest(new { error = "Invalid prescription data" });

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
