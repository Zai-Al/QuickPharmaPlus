namespace QuickPharmaPlus.Server.ModelsDTO.Report
{
    public sealed class CategoryRevenueReportDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = "";

        public string ScopeLabel { get; set; } = "";
        public DateOnly DateFrom { get; set; }
        public DateOnly DateTo { get; set; }

        public TotalRevenueKpisDto Kpis { get; set; } = new();

        public List<BranchRevenueKpiDto> BranchKpis { get; set; } = new();

        public List<CategoryTypeRevenueRowDto> TypeSales { get; set; } = new();

        public List<CategorySalesOrderRowDto> Orders { get; set; } = new();
    }
}