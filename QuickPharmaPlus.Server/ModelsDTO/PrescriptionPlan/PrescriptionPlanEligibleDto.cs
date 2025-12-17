namespace QuickPharmaPlus.Server.ModelsDTO.PrescriptionPlan
{
    public class PrescriptionPlanEligibleDto
    {
        public int PrescriptionId { get; set; }
        public string? PrescriptionName { get; set; }
        public DateOnly? ExpiryDate { get; set; }
    }
}
