using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Report;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class ReportRepository : IReportRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        private static readonly Regex ValidNamePattern = new(@"^[A-Za-z0-9 .\-+]*$");
        private static readonly Regex ValidIdPattern = new(@"^[0-9]*$");

        public ReportRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<ReportListItemDto>> GetReportsAsync(
            int pageNumber,
            int pageSize,
            int? reportId = null,
            string? reportName = null,
            int? reportTypeId = null,
            DateOnly? creationDate = null)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 12;

            var reportsQuery = _context.Reports.AsQueryable();

            if (reportId.HasValue)
            {
                reportsQuery = reportsQuery.Where(r => r.ReportId == reportId.Value);
            }

            if (!string.IsNullOrWhiteSpace(reportName))
            {
                var term = reportName.Trim();

                if (!ValidNamePattern.IsMatch(term))
                {
                    return new PagedResult<ReportListItemDto>
                    {
                        Items = new List<ReportListItemDto>(),
                        TotalCount = 0
                    };
                }

                var lower = term.ToLower();
                reportsQuery = reportsQuery.Where(r => (r.ReportName ?? "").ToLower().StartsWith(lower));
            }

            if (reportTypeId.HasValue && reportTypeId.Value > 0)
            {
                reportsQuery = reportsQuery.Where(r => r.ReportTypeId == reportTypeId.Value);
            }

            if (creationDate.HasValue)
            {
                var from = creationDate.Value.ToDateTime(TimeOnly.MinValue);
                var to = creationDate.Value.ToDateTime(TimeOnly.MaxValue);

                reportsQuery = reportsQuery.Where(r => r.ReportCreationTimestamp >= from && r.ReportCreationTimestamp <= to);
            }

            var total = await reportsQuery.CountAsync();

            var itemsQuery =
                from r in reportsQuery
                join rt in _context.ReportTypes on r.ReportTypeId equals rt.ReportTypeId into rtj
                from rt in rtj.DefaultIfEmpty()
                orderby r.ReportCreationTimestamp descending, r.ReportId descending
                select new ReportListItemDto
                {
                    ReportId = r.ReportId,
                    ReportName = r.ReportName,
                    ReportTypeId = r.ReportTypeId,
                    ReportTypeName = rt != null ? rt.ReportTypeName : null,
                    ReportCreationTimestamp = r.ReportCreationTimestamp,
                    FileName = r.FileName,
                    ContentType = r.ContentType,
                    DocumentSizeBytes = r.DocumentSizeBytes
                };

            var items = await itemsQuery
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<ReportListItemDto>
            {
                Items = items,
                TotalCount = total
            };
        }

        public async Task<List<ReportTypeOptionDto>> GetReportTypesAsync()
        {
            return await _context.ReportTypes
                .OrderBy(rt => rt.ReportTypeName)
                .Select(rt => new ReportTypeOptionDto
                {
                    Value = rt.ReportTypeId,
                    Label = rt.ReportTypeName ?? $"Type {rt.ReportTypeId}"
                })
                .ToListAsync();
        }
    }
}