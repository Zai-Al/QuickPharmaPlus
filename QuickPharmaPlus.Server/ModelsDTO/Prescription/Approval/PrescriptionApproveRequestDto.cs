namespace QuickPharmaPlus.Server.ModelsDTO.Prescription.Approval
{
    public class PrescriptionApproveRequestDto
    {
        public int ProductId { get; set; }
        public string? ExpiryDate { get; set; } // yyyy-MM-dd
        public string? Dosage { get; set; }
        public int Quantity { get; set; }
    }
}