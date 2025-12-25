using System;
using System.Collections.Generic;

namespace QuickPharmaPlus.Server.ModelsDTO.Report
{
    public sealed class ComplianceReportDto
    {
        public string ScopeLabel { get; set; } = "All branches";
        public DateOnly DateFrom { get; set; }
        public DateOnly DateTo { get; set; }

        public int DaysBeforeExpiryThreshold { get; set; } = 29;

        public List<ComplianceBranchSectionDto> Branches { get; set; } = new();
        public ComplianceOverallSummaryDto Overall { get; set; } = new();
    }

    public sealed class ComplianceBranchSectionDto
    {
        public int BranchId { get; set; }
        public string BranchName { get; set; } = "—";

        public List<ComplianceInventoryRowDto> Inventory { get; set; } = new();
        public List<ComplianceExpiredInventoryRowDto> NearExpiryInventory { get; set; } = new();
        public List<ComplianceExpiredInventoryRowDto> ExpiredInventory { get; set; } = new();

        public ComplianceInventoryInsightsDto InventoryInsights { get; set; } = new();

        public List<OrderListRowDto> Orders { get; set; } = new();
        public List<DeliveryRequestRowDto> DeliveryRequests { get; set; } = new();

        public List<SupplierOrderCostRowDto> SupplierOrders { get; set; } = new();
        public List<ReorderCostRowDto> Reorders { get; set; } = new();

        public List<CompliancePrescriptionRowDto> Prescriptions { get; set; } = new();
        public List<ComplianceApprovalRowDto> Approvals { get; set; } = new();

        public ComplianceControlledDispenseStatsDto ControlledDispenseStats { get; set; } = new();

        public List<ComplianceLogTypeCountRowDto> LogTypeCounts { get; set; } = new();
        public List<ComplianceEmployeeActionCountsRowDto> EmployeeActionCounts { get; set; } = new();
    }

    public sealed class ComplianceInventoryRowDto
    {
        public int InventoryId { get; set; }

        public int BranchId { get; set; }
        public string BranchName { get; set; } = "—";

        public int ProductId { get; set; }
        public string ProductName { get; set; } = "—";

        public string SupplierName { get; set; } = "—";
        public string CategoryName { get; set; } = "—";
        public string ProductTypeName { get; set; } = "—";

        public bool IsControlled { get; set; }

        public int Quantity { get; set; }
        public DateOnly? ExpiryDate { get; set; }
    }

    public sealed class ComplianceExpiredInventoryRowDto
    {
        public int InventoryId { get; set; }

        public int BranchId { get; set; }
        public string BranchName { get; set; } = "—";

        public int ProductId { get; set; }
        public string ProductName { get; set; } = "—";

        public int Quantity { get; set; }
        public DateOnly? ExpiryDate { get; set; }

        public string SupplierName { get; set; } = "—";
        public string CategoryName { get; set; } = "—";
        public string ProductTypeName { get; set; } = "—";
    }

    public sealed class ComplianceInventoryInsightsDto
    {
        public int TotalQuantity { get; set; }

        public string? TopStockProductName { get; set; }
        public int TopStockQuantity { get; set; }

        public string? LowStockProductName { get; set; }
        public int LowStockQuantity { get; set; }
    }

    public sealed class CompliancePrescriptionRowDto
    {
        public int PrescriptionId { get; set; }

        public int BranchId { get; set; }
        public string BranchName { get; set; } = "—";

        public string PrescriptionName { get; set; } = "—";
        public string CustomerName { get; set; } = "—";
        public DateOnly? CreationDate { get; set; }
        public string StatusName { get; set; } = "—";
    }

    public sealed class ComplianceApprovalRowDto
    {
        public int ApprovalId { get; set; }

        public int BranchId { get; set; }
        public string BranchName { get; set; } = "—";

        public int PrescriptionId { get; set; }
        public string PrescriptionName { get; set; } = "—";

        public int EmployeeUserId { get; set; }
        public string EmployeeName { get; set; } = "—";

        public DateOnly? ApprovalDate { get; set; }
        public DateTime? ApprovalTimestamp { get; set; }

        public string ProductName { get; set; } = "—";
        public bool IsControlled { get; set; }
        public int Quantity { get; set; }
        public DateOnly? PrescriptionExpiryDate { get; set; }
    }

    public sealed class ComplianceControlledDispenseStatsDto
    {
        public int ControlledDispensedLogsCount { get; set; }
        public int ControlledDispensedApprovalsCount { get; set; }
    }

    public sealed class ComplianceLogTypeCountRowDto
    {
        public int LogTypeId { get; set; }
        public string LogTypeName { get; set; } = "—";
        public int Count { get; set; }
    }

    public sealed class ComplianceEmployeeActionCountsRowDto
    {
        public int EmployeeUserId { get; set; }
        public string EmployeeName { get; set; } = "—";

        public int InventoryChangeCount { get; set; }
        public int AddRecordCount { get; set; }
        public int EditRecordCount { get; set; }
        public int DeleteRecordCount { get; set; }
        public int PrescriptionApprovalCount { get; set; }
        public int PrescriptionRejectionCount { get; set; }
        public int ControlledDispensedCount { get; set; }

        public int TotalImportantActions =>
            InventoryChangeCount +
            AddRecordCount +
            EditRecordCount +
            DeleteRecordCount +
            PrescriptionApprovalCount +
            PrescriptionRejectionCount +
            ControlledDispensedCount;
    }

    public sealed class ComplianceOverallSummaryDto
    {
        public string? MostActiveBranchName { get; set; }
        public string? LeastActiveBranchName { get; set; }

        public string? MostControlledDispenseBranchName { get; set; }
        public string? LeastControlledDispenseBranchName { get; set; }

        public string? TopEmployeeName { get; set; }
        public string? LeastActiveEmployeeName { get; set; }
    }
}