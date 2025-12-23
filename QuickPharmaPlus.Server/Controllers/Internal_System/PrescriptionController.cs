using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Prescription;
using QuickPharmaPlus.Server.ModelsDTO.Prescription.Approval;
using QuickPharmaPlus.Server.Repositories.Interface;
using QuickPharmaPlus.Server.Services;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    public class PrescriptionController : ControllerBase
    {
        private readonly IPrescriptionRepository _prescriptionRepository;
        private readonly QuickPharmaPlusDbContext _context;
        private readonly IQuickPharmaLogRepository _logRepo;
        private readonly IPrescriptionNotificationEmailService _prescriptionEmailService;

        public PrescriptionController(
            IPrescriptionRepository prescriptionRepository,
            QuickPharmaPlusDbContext context,
            IQuickPharmaLogRepository logRepo,
            IPrescriptionNotificationEmailService prescriptionEmailService)
        {
            _prescriptionRepository = prescriptionRepository;
            _context = context;
            _logRepo = logRepo;
            _prescriptionEmailService = prescriptionEmailService;
        }

        public class PrescriptionRejectRequestDto
        {
            public string? Reason { get; set; }
        }

        [HttpPost("{prescriptionId:int}/reject")]
        [Authorize(Roles = "Admin,Pharmacist,Manager")]
        public async Task<IActionResult> RejectPrescription(int prescriptionId, [FromBody] PrescriptionRejectRequestDto dto)
        {
            if (prescriptionId <= 0)
                return BadRequest(new { error = "Invalid prescriptionId." });

            var reason = dto?.Reason?.Trim();
            if (string.IsNullOrWhiteSpace(reason))
                return BadRequest(new { error = "Rejection reason is required." });

            var identityUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(identityUserId))
                return Unauthorized();

            var employee = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.IdentityUserId == identityUserId);

            if (employee == null)
                return Forbid("Domain user record not found.");

            var employeeName = $"{employee.FirstName} {employee.LastName}".Trim();

            var prescription = await _context.Prescriptions
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.PrescriptionId == prescriptionId);

            if (prescription == null)
                return NotFound(new { error = "Prescription not found." });

            var customer = prescription.User;
            var customerEmail = customer?.EmailAddress;

            if (string.IsNullOrWhiteSpace(customerEmail))
                return BadRequest(new { error = "Customer email address is missing. Cannot send rejection email." });

            // Update status
            prescription.PrescriptionStatusId = PrescriptionStatusConstants.Rejected;
            await _context.SaveChangesAsync();

            // Bahrain time
            var bahrainNow = DateTime.UtcNow.AddHours(3);

            // Send email
            await _prescriptionEmailService.SendPrescriptionRejectedAsync(
                toEmail: customerEmail,
                customerName: $"{customer?.FirstName} {customer?.LastName}".Trim(),
                prescriptionId: prescriptionId,
                prescriptionName: prescription.PrescriptionName ?? "Prescription",
                rejectedByName: employeeName,
                bahrainTimestamp: bahrainNow,
                rejectionReason: reason
            );

            // 1) Rejection log includes email details + reason
            var rejectionLogDetails =
                $"Email sent to customer ({customerEmail}). " +
                $"Subject: [QuickPharma+] Prescription Rejected (ID: {prescriptionId}). " +
                $"Reason: {reason}";

            await _logRepo.CreatePrescriptionRejectionLogAsync(employee.UserId, prescriptionId, rejectionLogDetails);

            // 2) Edit log describes status change + email sent (your requested wording)
            await _logRepo.CreateEditRecordLogAsync(
                userId: employee.UserId,
                tableName: "Prescription",
                recordId: prescriptionId,
                details: $"Status updated to Rejected (4). Email sent to customer. Reason: {reason}"
            );

            return Ok(new { rejected = true });
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Pharmacist,Manager")]
        public async Task<IActionResult> GetAllPrescriptions(
             int pageNumber = 1,
             int pageSize = 10,
             int? customerId = null,
             int? statusId = null,
             DateOnly? date = null,
             int? branchId = null
        )
        {
            try
            {
                // ============================
                // ROLE-BASED BRANCH ISOLATION
                // ============================

                // Get Identity User ID from token
                var identityUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(identityUserId))
                    return Unauthorized();

                bool isAdmin = User.IsInRole("Admin");

                int? effectiveBranchId;

                if (isAdmin)
                {
                    // Admin can see all prescriptions or filter by branch
                    effectiveBranchId = branchId;
                }
                else
                {
                    // Non-admin: resolve branch from DOMAIN User table
                    var domainUser = await _context.Users
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.IdentityUserId == identityUserId);

                    if (domainUser == null)
                        return Forbid("Domain user record not found.");

                    if (!domainUser.BranchId.HasValue)
                        return Forbid("User is not assigned to a branch.");

                    // FORCE branch isolation
                    effectiveBranchId = domainUser.BranchId.Value;
                }

                // ============================
                // FETCH PRESCRIPTIONS
                // ============================

                var result = await _prescriptionRepository.GetAllPrescriptionsAsync(
                    pageNumber,
                    pageSize,
                    customerId,
                    statusId,
                    date,
                    effectiveBranchId
                );

                return Ok(new
                {
                    items = result.Items,
                    totalCount = result.TotalCount,
                    pageNumber,
                    pageSize
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/Prescription/statuses
        //[Authorize(Roles = "Admin,Pharmacist,Manager")]
        [HttpGet("statuses")]
        public async Task<IActionResult> GetAllStatuses()
        {
            var statuses = await _prescriptionRepository.GetAllStatusesAsync();
            return Ok(statuses);
        }

        [HttpGet("{prescriptionId:int}")]
        [Authorize(Roles = "Admin,Pharmacist,Manager")]
        public async Task<IActionResult> GetPrescriptionDetails(int prescriptionId)
        {
            try
            {
                if (prescriptionId <= 0) return BadRequest(new { error = "Invalid prescriptionId" });

                var identityUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(identityUserId))
                    return Unauthorized();

                bool isAdmin = User.IsInRole("Admin");

                int? effectiveBranchId;
                if (isAdmin)
                {
                    effectiveBranchId = null;
                }
                else
                {
                    var domainUser = await _context.Users
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.IdentityUserId == identityUserId);

                    if (domainUser == null)
                        return Forbid("Domain user record not found.");

                    if (!domainUser.BranchId.HasValue)
                        return Forbid("User is not assigned to a branch.");

                    effectiveBranchId = domainUser.BranchId.Value;
                }

                var dto = await _prescriptionRepository.GetInternalPrescriptionDetailsAsync(
                    prescriptionId,
                    effectiveBranchId
                );

                if (dto == null) return NotFound(new { error = "Prescription not found." });

                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{prescriptionId:int}/document")]
        [Authorize(Roles = "Admin,Pharmacist,Manager")]
        public async Task<IActionResult> ViewPrescriptionDocument(int prescriptionId)
        {
            try
            {
                var identityUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(identityUserId))
                    return Unauthorized();

                bool isAdmin = User.IsInRole("Admin");
                int? effectiveBranchId;

                if (isAdmin)
                {
                    effectiveBranchId = null;
                }
                else
                {
                    var domainUser = await _context.Users
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.IdentityUserId == identityUserId);

                    if (domainUser == null)
                        return Forbid("Domain user record not found.");

                    if (!domainUser.BranchId.HasValue)
                        return Forbid("User is not assigned to a branch.");

                    effectiveBranchId = domainUser.BranchId.Value;
                }

                var doc = await _prescriptionRepository.GetInternalPrescriptionDocumentAsync(
                    prescriptionId,
                    effectiveBranchId
                );

                if (doc == null) return NotFound(new { error = "Prescription document not found." });

                Response.Headers["Content-Disposition"] = "inline";
                return File(doc.Value.bytes, doc.Value.contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{prescriptionId:int}/cpr")]
        [Authorize(Roles = "Admin,Pharmacist,Manager")]
        public async Task<IActionResult> ViewCprDocument(int prescriptionId)
        {
            try
            {
                var identityUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(identityUserId))
                    return Unauthorized();

                bool isAdmin = User.IsInRole("Admin");
                int? effectiveBranchId;

                if (isAdmin)
                {
                    effectiveBranchId = null;
                }
                else
                {
                    var domainUser = await _context.Users
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.IdentityUserId == identityUserId);

                    if (domainUser == null)
                        return Forbid("Domain user record not found.");

                    if (!domainUser.BranchId.HasValue)
                        return Forbid("User is not assigned to a branch.");

                    effectiveBranchId = domainUser.BranchId.Value;
                }

                var doc = await _prescriptionRepository.GetInternalCprDocumentAsync(
                    prescriptionId,
                    effectiveBranchId
                );

                if (doc == null) return NotFound(new { error = "CPR document not found." });

                Response.Headers["Content-Disposition"] = "inline";
                return File(doc.Value.bytes, doc.Value.contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("{prescriptionId:int}/approve")]
        [Authorize(Roles = "Admin,Pharmacist,Manager")]
        public async Task<IActionResult> ApprovePrescription(int prescriptionId, [FromBody] PrescriptionApproveRequestDto dto)
        {
            if (prescriptionId <= 0)
                return BadRequest(new { error = "Invalid prescriptionId." });

            if (dto == null)
                return BadRequest(new { error = "Invalid request body." });

            var identityUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(identityUserId))
                return Unauthorized();

            var employee = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.IdentityUserId == identityUserId);

            if (employee == null)
                return Forbid("Domain user record not found.");

            var result = await _prescriptionRepository.ApprovePrescriptionAsync(
                prescriptionId: prescriptionId,
                employeeUserId: employee.UserId,
                dto: dto);

            if (result == null)
                return BadRequest(new { error = "Invalid approval data or prescription not found." });

            var employeeName = $"{employee.FirstName} {employee.LastName}".Trim();

            await _prescriptionEmailService.SendPrescriptionApprovedAsync(
                toEmail: result.CustomerEmail,
                customerName: result.CustomerName,
                prescriptionId: prescriptionId,
                prescriptionName: result.PrescriptionName,
                approvedByName: employeeName,
                bahrainTimestamp: result.BahrainTimestamp,
                approvedProductName: result.ApprovedProductName,
                approvedQuantity: result.Quantity,
                approvedDosage: result.Dosage,
                expiryDate: result.ExpiryDate,
                orderId: result.OrderId,
                shippingId: result.ShippingId
            );

            await _logRepo.CreatePrescriptionApprovalLogAsync(employee.UserId, prescriptionId);

            await _logRepo.CreateAddRecordLogAsync(
                userId: employee.UserId,
                tableName: "Approval",
                recordId: result.ApprovalId,
                details: $"PrescriptionId: {prescriptionId}, Product: {result.ApprovedProductName}, Qty: {result.Quantity}, Expiry: {result.ExpiryDate:yyyy-MM-dd}"
            );

            await _logRepo.CreateEditRecordLogAsync(
                userId: employee.UserId,
                tableName: "Prescription",
                recordId: prescriptionId,
                details: "Status updated to Approved (1). Approval record created. Approval email sent to customer."
            );

            if (result.IsControlled)
            {
                await _logRepo.CreateControlledProductDispensedLogAsync(
                    userId: employee.UserId,
                    productName: result.ApprovedProductName,
                    prescriptionId: prescriptionId
                );
            }

            return Ok(new
            {
                approved = true,
                approvalId = result.ApprovalId,
                orderId = result.OrderId,
                shippingId = result.ShippingId
            });
        }
    }
}