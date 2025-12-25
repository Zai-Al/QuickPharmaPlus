using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Report;
using QuickPharmaPlus.Server.Repositories.Interface;
using QuickPharmaPlus.Server.Services.Reports;

namespace QuickPharmaPlus.Server.Controllers.Internal_System;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public sealed class ReportsController : ControllerBase
{
    private readonly IReportRepository _repo;
    private readonly IReportPdfGenerator _pdf;

    private readonly IQuickPharmaLogRepository _logger;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly QuickPharmaPlusDbContext _context;

    public ReportsController(
        IReportRepository repo,
        IReportPdfGenerator pdf,
        IQuickPharmaLogRepository logger,
        UserManager<ApplicationUser> userManager,
        QuickPharmaPlusDbContext context)
    {
        _repo = repo;
        _pdf = pdf;
        _logger = logger;
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

        var domainUser = await _context.Users.FirstOrDefaultAsync(u => u.EmailAddress == userEmail);
        return domainUser?.UserId;
    }

    // GET: api/Reports?pageNumber=1&pageSize=12&reportId=...&reportName=...&reportTypeId=...&creationDate=YYYY-MM-DD
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] int? reportId = null,
        [FromQuery] string? reportName = null,
        [FromQuery] int? reportTypeId = null,
        [FromQuery] DateOnly? creationDate = null)
    {
        var result = await _repo.GetReportsAsync(
            pageNumber,
            pageSize,
            reportId,
            reportName,
            reportTypeId,
            creationDate);

        // Match the client’s expected shape: { items, totalCount }
        return Ok(new
        {
            items = result.Items,
            totalCount = result.TotalCount
        });
    }

    [HttpPost("Generate")]
    public async Task<IActionResult> Generate([FromBody] ReportGenerateRequestDto dto)
    {
        if (dto == null) return BadRequest("INVALID_BODY");

        dto.Branch = string.IsNullOrWhiteSpace(dto.Branch) ? null : dto.Branch.Trim();

        // Normalize "all branches"
        if (dto.Branch is not null &&
            (dto.Branch.Equals("ALL", StringComparison.OrdinalIgnoreCase) || dto.Branch == "0"))
        {
            dto.Branch = null;
        }

        // Validate branch (if provided must be numeric id)
        int? branchId = null;
        if (dto.Branch is not null)
        {
            if (!int.TryParse(dto.Branch, out var parsedBranchId) || parsedBranchId <= 0)
                return BadRequest("INVALID_BRANCH");

            branchId = parsedBranchId;
        }

        if (string.IsNullOrWhiteSpace(dto.ReportType))
            return BadRequest("REPORT_TYPE_REQUIRED");

        if (!DateOnly.TryParse(dto.DateFrom, out var from))
            return BadRequest("INVALID_DATE_FROM");

        if (!DateOnly.TryParse(dto.DateTo, out var to))
            return BadRequest("INVALID_DATE_TO");

        if (from > to)
            return BadRequest("DATE_RANGE_INVALID");

        // Optional: translate branchId to a nice label for logs/description
        string branchLabel = "All branches";
        if (branchId.HasValue)
        {
            var cityName = await _context.Branches
                .AsNoTracking()
                .Where(b => b.BranchId == branchId.Value)
                .Select(b => b.Address != null && b.Address.City != null ? b.Address.City.CityName : null)
                .FirstOrDefaultAsync();

            branchLabel = !string.IsNullOrWhiteSpace(cityName)
                ? cityName
                : $"Branch {branchId.Value}";
        }

        var reportTypeName = dto.ReportType.Trim();
        var baseTitle = $"{reportTypeName} Report";

        var reportTypeId = await _repo.ResolveReportTypeIdAsync(reportTypeName);
        if (!reportTypeId.HasValue)
            return BadRequest("INVALID_REPORT_TYPE");

        TotalRevenueReportDto? totalRevenue = null;
        SupplierRevenueReportDto? supplierRevenue = null;
        CategoryRevenueReportDto? categoryRevenue = null;
        ProductRevenueReportDto? productRevenue = null;
        ComplianceReportDto? complianceReport = null;

        if (reportTypeId.Value == 1)
        {
            totalRevenue = await _repo.BuildTotalRevenueReportAsync(from, to, branchId);
        }
        else if (reportTypeId.Value == 2)
        {
            if (string.IsNullOrWhiteSpace(dto.ProductCategory))
                return BadRequest("CATEGORY_REQUIRED");

            if (!int.TryParse(dto.ProductCategory, out var categoryId) || categoryId <= 0)
                return BadRequest("INVALID_CATEGORY");

            categoryRevenue = await _repo.BuildCategoryRevenueReportAsync(from, to, categoryId, branchId);
        }
        else if (reportTypeId.Value == 3)
        {
            if (string.IsNullOrWhiteSpace(dto.Supplier))
                return BadRequest("SUPPLIER_REQUIRED");

            if (!int.TryParse(dto.Supplier, out var supplierId) || supplierId <= 0)
                return BadRequest("INVALID_SUPPLIER");

            supplierRevenue = await _repo.BuildSupplierRevenueReportAsync(from, to, supplierId, branchId);
        }
        else if (reportTypeId.Value == 4)
        {
            if (string.IsNullOrWhiteSpace(dto.Product))
                return BadRequest("PRODUCT_REQUIRED");

            if (!int.TryParse(dto.Product, out var productId) || productId <= 0)
                return BadRequest("INVALID_PRODUCT");

            productRevenue = await _repo.BuildProductRevenueReportAsync(from, to, productId, branchId);
        }
        else if (reportTypeId.Value == 5)
        {
            complianceReport = await _repo.BuildComplianceReportAsync(from, to, branchId);
        }

        var pdf = _pdf.Generate(dto, baseTitle, totalRevenue, supplierRevenue, categoryRevenue, productRevenue, complianceReport);

        var fileName = $"{reportTypeName}-{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";

        var currentUserId = await GetCurrentUserIdAsync();
        int? userId = currentUserId;

        // temp name first (will be updated after insert)
        var reportIdCreated = await _repo.CreateReportAsync(
            reportTypeId,
            userId,
            reportName: baseTitle,
            description: $"Generated for {branchLabel} ({from:yyyy-MM-dd} to {to:yyyy-MM-dd})",
            pdfBytes: pdf,
            fileName: fileName
        );

        // final auto-name uses the generated id
        var finalName = $"{baseTitle} #{reportIdCreated}";
        await _repo.UpdateReportNameAsync(reportIdCreated, finalName);

        // =================== CREATE ADD-RECORD LOG ===================
        if (currentUserId.HasValue)
        {
            var details =
                $"Report Name: {finalName}, " +
                $"Branch: {branchLabel}, " +
                $"Date Range: {from:yyyy-MM-dd} → {to:yyyy-MM-dd}, " +
                $"File: {fileName}, " +
                $"Size: {pdf.Length} bytes";

            await _logger.CreateAddRecordLogAsync(
                userId: currentUserId.Value,
                tableName: "Report",
                recordId: reportIdCreated,
                details: details
            );
        }

        return Ok(new ReportGenerateResponseDto
        {
            ReportId = reportIdCreated,
            FileName = fileName
        });
    }

    [HttpGet("{id:int}/document")]
    public async Task<IActionResult> GetDocument([FromRoute] int id)
    {
        var doc = await _repo.GetReportDocumentAsync(id);
        if (doc == null) return NotFound(new { error = "Report document not found." });

        // Inline display in browser
        Response.Headers["Content-Disposition"] = "inline";

        // IMPORTANT: do NOT pass fileName here, otherwise many browsers treat it as download
        return File(doc.Value.bytes, doc.Value.contentType);
    }

    [HttpGet("{id:int}/download")]
    public async Task<IActionResult> Download([FromRoute] int id)
    {
        var doc = await _repo.GetReportDocumentAsync(id);
        if (doc == null) return NotFound(new { error = "Report document not found." });

        Response.Headers["Content-Disposition"] = $"attachment; filename=\"{doc.Value.fileName}\"";
        return File(doc.Value.bytes, doc.Value.contentType, doc.Value.fileName);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById([FromRoute] int id)
    {
        var details = await _repo.GetReportDetailsAsync(id);
        if (details == null) return NotFound(new { error = "Report not found." });

        return Ok(details);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete([FromRoute] int id)
    {
        if (id <= 0)
            return BadRequest("Invalid report ID.");

        // Get details before deletion (for logging)
        var reportToDelete = await _context.Reports
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.ReportId == id);

        if (reportToDelete == null)
            return NotFound("Report not found.");

        var reportTypeName = await _context.ReportTypes
            .AsNoTracking()
            .Where(rt => rt.ReportTypeId == reportToDelete.ReportTypeId)
            .Select(rt => rt.ReportTypeName)
            .FirstOrDefaultAsync();

        var currentUserId = await GetCurrentUserIdAsync();

        var deleted = await _repo.DeleteReportAsync(id);
        if (!deleted)
            return NotFound("Report not found or could not be deleted.");

        // Log deletion (uses your local repository function)
        if (currentUserId.HasValue)
        {
            var details =
                $"Deleted Report: {reportToDelete.ReportName ?? "Unknown"}, " +
                $"Type: {reportTypeName ?? "Unknown"}, " +
                $"File: {reportToDelete.FileName ?? "Unknown"}";

            await _logger.CreateDeleteRecordLogAsync(
                userId: currentUserId.Value,
                tableName: "Report",
                recordId: id,
                details: details
            );
        }

        return Ok(new { deleted = true, message = "Report deleted successfully." });
    }
}