using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using QuickPharmaPlus.Server.Repositories.Interface;
using QuickPharmaPlus.Server.ModelsDTO.Prescription;
using System;

namespace QuickPharmaPlus.Server.Controllers.External_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
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

        // ✅ HEALTH PRESCRIPTIONS ONLY (NO PAGINATION)
        // GET: /api/Prescription/user/5
        [HttpGet("user/{userId:int}")]
        public async Task<IActionResult> GetUserHealthPrescriptions(int userId)
        {
            try
            {
                var items = await _repo.GetUserHealthPrescriptionsAsync(userId);
                return Ok(items ?? new List<PrescriptionListDto>());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetUserHealthPrescriptions (user:{user})", userId);

                return StatusCode(500, new
                {
                    error = "An unexpected error occurred while loading prescriptions."
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
            var ok = await _repo.UpdateAsync(userId, prescriptionId, dto);
            if (!ok) return NotFound(new { error = "Prescription not found." });

            return Ok(new { message = "Prescription updated successfully." });
        }

        // DELETE: /api/Prescription/user/5/123
        [HttpDelete("user/{userId:int}/{prescriptionId:int}")]
        public async Task<IActionResult> Delete(int userId, int prescriptionId)
        {
            var ok = await _repo.DeleteAsync(userId, prescriptionId);
            if (!ok) return NotFound(new { error = "Prescription not found." });

            return Ok(new { message = "Prescription deleted successfully." });
        }

        // GET: /api/Prescription/user/5/123/document
        [HttpGet("user/{userId:int}/{prescriptionId:int}/document")]
        public async Task<IActionResult> GetDocument(int userId, int prescriptionId)
        {
            var doc = await _repo.GetPrescriptionDocumentAsync(userId, prescriptionId);
            if (doc == null) return NotFound(new { error = "Prescription document not found." });

            return File(doc.Value.bytes, doc.Value.contentType, $"prescription_{prescriptionId}.pdf");
        }

        // GET: /api/Prescription/user/5/123/cpr
        [HttpGet("user/{userId:int}/{prescriptionId:int}/cpr")]
        public async Task<IActionResult> GetCpr(int userId, int prescriptionId)
        {
            var doc = await _repo.GetCprDocumentAsync(userId, prescriptionId);
            if (doc == null) return NotFound(new { error = "CPR document not found." });

            return File(doc.Value.bytes, doc.Value.contentType, $"cpr_{prescriptionId}.pdf");
        }
    }
}
