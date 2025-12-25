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

        Task<int> CreateReportAsync(int? reportTypeId, int? userId, string reportName, string? description, byte[] pdfBytes, string fileName);
        Task<(byte[] bytes, string contentType, string fileName)?> GetReportDocumentAsync(int reportId);

        Task UpdateReportNameAsync(int reportId, string reportName);

        Task<ReportDetailsDto?> GetReportDetailsAsync(int reportId);

        Task<int?> ResolveReportTypeIdAsync(string reportTypeName);

        Task<TotalRevenueReportDto> BuildTotalRevenueReportAsync(DateOnly from, DateOnly to, int? branchId);

        // ReportTypeId = 2
        Task<CategoryRevenueReportDto> BuildCategoryRevenueReportAsync(DateOnly from, DateOnly to, int categoryId, int? branchId);

        // ReportTypeId = 3
        Task<SupplierRevenueReportDto> BuildSupplierRevenueReportAsync(DateOnly from, DateOnly to, int supplierId, int? branchId);

        // ReportTypeId = 4
        Task<ProductRevenueReportDto> BuildProductRevenueReportAsync(DateOnly from, DateOnly to, int productId, int? branchId);

        // ReportTypeId = 5
        Task<ComplianceReportDto> BuildComplianceReportAsync(DateOnly from, DateOnly to, int? branchId);

        Task<bool> DeleteReportAsync(int reportId);
    }
}