namespace QuickPharmaPlus.Server.ModelsDTO.Dashboard
{
    public class DriverDashboardDto
    {
        public string? DriverSlotName { get; set; }
        public DriverDashboardMetricsDto Metrics { get; set; } = new();
    }

    public class DriverDashboardMetricsDto
    {
        // Slot-specific metrics (filtered by BOTH slot AND branch)
        public int MySlotPendingDeliveries { get; set; }
        public int MySlotTodaysDeliveries { get; set; }
        public int MySlotUrgentDeliveries { get; set; }
        public int MySlotTotalDeliveries { get; set; }
        
        // Branch-level metrics (all slots in this branch)
        public int BranchPendingDeliveries { get; set; }
        public int BranchTotalDeliveries { get; set; }
    }
}