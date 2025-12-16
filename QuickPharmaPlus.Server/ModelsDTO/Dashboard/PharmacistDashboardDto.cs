namespace QuickPharmaPlus.Server.ModelsDTO.Dashboard
{
    public class PharmacistDashboardDto
    {
        public PharmacistDashboardMetricsDto Metrics { get; set; } = new();
    }

    public class PharmacistDashboardMetricsDto
    {
        // Pharmacist's personal metrics
        public int MyTotalApprovals { get; set; }
        public int MyApprovalsToday { get; set; }
        
        // Branch-level metrics (shared responsibility)
        public int BranchPendingPrescriptions { get; set; }
        public int BranchTotalPrescriptions { get; set; }
        public int BranchTotalOrders { get; set; }
        public int BranchControlledMedicationsDispensed { get; set; }
    }
}