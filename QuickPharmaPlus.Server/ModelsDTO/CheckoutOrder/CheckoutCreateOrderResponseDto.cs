namespace QuickPharmaPlus.Server.ModelsDTO.CheckoutOrder
{
    public class CheckoutCreateOrderResponseDto
    {
        public bool Created { get; set; }
        public int? OrderId { get; set; }
        public int? ShippingId { get; set; }
        public int? CreatedPrescriptionId { get; set; }

        public string? Message { get; set; }

        // prescription validation details (optional)
        public bool PrescriptionValid { get; set; } = true;
        public string? PrescriptionReason { get; set; }

        // shipping/inventory validation
        public List<string> UnavailableProductNames { get; set; } = new();
    }
}
