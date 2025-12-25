using QuickPharmaPlus.Server.ModelsDTO.Report;

namespace QuickPharmaPlus.Server.Services.Reports
{
    public interface IReportPdfGenerator
    {
        byte[] Generate(
            ReportGenerateRequestDto request,
            string title,
            TotalRevenueReportDto? totalRevenue = null,
            SupplierRevenueReportDto? supplierRevenue = null,
            CategoryRevenueReportDto? categoryRevenue = null);
    }
}