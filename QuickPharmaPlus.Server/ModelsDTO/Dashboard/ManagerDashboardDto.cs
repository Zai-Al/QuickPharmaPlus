namespace QuickPharmaPlus.Server.ModelsDTO.Dashboard
{
    public class ManagerDashboardDto
    {
        public List<SalesPerSupplierBranchDto> SalesPerSupplier { get; set; } = new();
        public List<SalesPerCategoryBranchDto> SalesPerCategory { get; set; } = new();
        public List<PrescriptionApprovalsPerPharmacistDto> PrescriptionApprovalsPerPharmacist { get; set; } = new();
        public ManagerDashboardMetricsDto Metrics { get; set; } = new();
    }

    public class SalesPerSupplierBranchDto
    {
        public string SupplierName { get; set; } = string.Empty;
        public decimal TotalSales { get; set; }
    }

    public class SalesPerCategoryBranchDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public decimal TotalSales { get; set; }
    }

    public class PrescriptionApprovalsPerPharmacistDto
    {
        public string PharmacistName { get; set; } = string.Empty;
        public int TotalApprovals { get; set; }
    }

    public class ManagerDashboardMetricsDto
    {
        public decimal TotalBranchSales { get; set; }
        public decimal TodayBranchSales { get; set; }
        public int TotalBranchEmployees { get; set; }
        public int TotalBranchPrescriptions { get; set; }
        public int TotalBranchDeliveries { get; set; }
        public int TodayBranchDeliveries { get; set; }
        public int TotalBranchInventory { get; set; }
        public int TotalBranchOrders { get; set; }
    }
}