namespace QuickPharmaPlus.Server.ModelsDTO.Dashboard
{
    public class AdminDashboardDto
    {
        public List<SalesPerBranchDto> SalesPerBranch { get; set; } = new();
        public List<InventoryPerBranchDto> InventoryPerBranch { get; set; } = new();
        public List<PrescriptionsPerBranchDto> PrescriptionsPerBranch { get; set; } = new();
        public List<SalesPerCategoryDto> SalesPerCategory { get; set; } = new();
        public List<SalesPerSupplierDto> SalesPerSupplier { get; set; } = new();
        public AdminDashboardMetricsDto Metrics { get; set; } = new();
    }

    public class SalesPerBranchDto
    {
        public string BranchCity { get; set; } = string.Empty;
        public decimal TotalSales { get; set; }
    }

    public class InventoryPerBranchDto
    {
        public string BranchCity { get; set; } = string.Empty;
        public int TotalInventory { get; set; }
    }

    public class PrescriptionsPerBranchDto
    {
        public string BranchCity { get; set; } = string.Empty;
        public int TotalPrescriptions { get; set; }
    }

    public class SalesPerCategoryDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public decimal TotalSales { get; set; }
    }

    public class SalesPerSupplierDto
    {
        public string SupplierName { get; set; } = string.Empty;
        public decimal TotalSales { get; set; }
    }

    public class AdminDashboardMetricsDto
    {
        public int TotalSalesCount { get; set; }
        public int TodaysSalesCount { get; set; }
        public int TotalEmployeesCount { get; set; }
        public int TotalSuppliersCount { get; set; } // NEW - Total number of suppliers
        public List<EmployeesPerBranchDto> EmployeesPerBranch { get; set; } = new();
        public int TotalLogsCount { get; set; }
        public int TodaysLogsCount { get; set; }
        public int TotalReportsCount { get; set; }
        public int TodaysReportsCount { get; set; }
    }

    public class EmployeesPerBranchDto
    {
        public string BranchCity { get; set; } = string.Empty;
        public int EmployeeCount { get; set; }
    }
}