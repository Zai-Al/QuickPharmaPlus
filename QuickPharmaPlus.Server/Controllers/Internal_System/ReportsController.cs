using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.Internal_System;

[ApiController]
[Route("api/[controller]")]
//[Authorize(Roles = "Admin")]
public sealed class ReportsController : ControllerBase
{
    private readonly IReportRepository _repo;

    public ReportsController(IReportRepository repo)
    {
        _repo = repo;
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
}