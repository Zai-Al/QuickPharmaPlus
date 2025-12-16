namespace QuickPharmaPlus.Server.ModelsDTO.Prescription
{
    public class PrescriptionListDto
    {
        public int PrescriptionId { get; set; }
        public string? PrescriptionName { get; set; }

        public int? PrescriptionStatusId { get; set; }
        public string? PrescriptionStatusName { get; set; }

        public DateOnly? PrescriptionCreationDate { get; set; }

        public bool? IsHealthPerscription { get; set; }

        public bool HasPrescriptionDocument { get; set; }
        public bool HasCprDocument { get; set; }

        // Useful for UI: latest expiry (from Approval table)
        public DateOnly? LatestApprovalExpiryDate { get; set; }
    }
}
