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

        public async Task<int> CreateReportAsync(
            int? reportTypeId,
            int? userId,
            string reportName,
            string? description,
            byte[] pdfBytes,
            string fileName)
        {
            var contentType = "application/pdf";

            var entity = new Report
            {
                ReportTypeId = reportTypeId,
                UserId = userId,
                ReportName = reportName,
                ReportDescription = description,
                ReportDocument = pdfBytes,
                FileName = fileName,
                ContentType = contentType,
                DocumentSizeBytes = pdfBytes?.Length ?? 0
            };

            _context.Reports.Add(entity);
            await _context.SaveChangesAsync();
            return entity.ReportId;
        }

        public async Task UpdateReportNameAsync(int reportId, string reportName)
        {
            if (reportId <= 0) return;

            var entity = await _context.Reports.FirstOrDefaultAsync(r => r.ReportId == reportId);
            if (entity == null) return;

            entity.ReportName = reportName;
            await _context.SaveChangesAsync();
        }

        public async Task<(byte[] bytes, string contentType, string fileName)?> GetReportDocumentAsync(int reportId)
        {
            if (reportId <= 0) return null;

            var r = await _context.Reports
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.ReportId == reportId);

            if (r?.ReportDocument == null || r.ReportDocument.Length == 0) return null;

            return (
                r.ReportDocument,
                string.IsNullOrWhiteSpace(r.ContentType) ? "application/pdf" : r.ContentType,
                string.IsNullOrWhiteSpace(r.FileName) ? $"report-{reportId}.pdf" : r.FileName
            );
        }

        public async Task<ReportDetailsDto?> GetReportDetailsAsync(int reportId)
        {
            if (reportId <= 0) return null;

            var query =
                from r in _context.Reports.AsNoTracking()
                where r.ReportId == reportId
                join rt in _context.ReportTypes on r.ReportTypeId equals rt.ReportTypeId into rtj
                from rt in rtj.DefaultIfEmpty()
                join u in _context.Users on r.UserId equals u.UserId into uj
                from u in uj.DefaultIfEmpty()
                select new ReportDetailsDto
                {
                    ReportId = r.ReportId,
                    ReportName = r.ReportName,
                    ReportDescription = r.ReportDescription,
                    ReportTypeId = r.ReportTypeId,
                    ReportTypeName = rt != null ? rt.ReportTypeName : null,
                    ReportCreationTimestamp = r.ReportCreationTimestamp,
                    GeneratedByUserId = r.UserId,
                    GeneratedByName = u != null ? ((u.FirstName ?? "") + " " + (u.LastName ?? "")).Trim() : null,
                    GeneratedByEmail = u != null ? u.EmailAddress : null,
                    FileName = r.FileName,
                    ContentType = r.ContentType,
                    DocumentSizeBytes = r.DocumentSizeBytes
                };

            return await query.FirstOrDefaultAsync();
        }
    }
}