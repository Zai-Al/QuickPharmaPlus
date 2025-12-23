using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Report;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IReportRepository
    {
        Task<PagedResult<ReportListItemDto>> GetReportsAsync(
            int pageNumber,
            int pageSize,
            int? reportId = null,
            string? reportName = null,
            int? reportTypeId = null,
            DateOnly? creationDate = null);

        Task<List<ReportTypeOptionDto>> GetReportTypesAsync();
    }
}