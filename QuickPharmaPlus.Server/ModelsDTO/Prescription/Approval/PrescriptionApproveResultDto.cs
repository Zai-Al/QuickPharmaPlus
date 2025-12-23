namespace QuickPharmaPlus.Server.ModelsDTO.Prescription.Approval
{
    public class PrescriptionApproveResultDto
    {
        public bool Approved { get; set; }
        public int ApprovalId { get; set; }

        public int? OrderId { get; set; }
        public int? ShippingId { get; set; }

        public string CustomerEmail { get; set; } = "";
        public string CustomerName { get; set; } = "";
        public string PrescriptionName { get; set; } = "";

        public string ApprovedProductName { get; set; } = "";
        public bool IsControlled { get; set; }

        public DateOnly ExpiryDate { get; set; }
        public string Dosage { get; set; } = "";
        public int Quantity { get; set; }

        public DateTime BahrainTimestamp { get; set; }
    }
}