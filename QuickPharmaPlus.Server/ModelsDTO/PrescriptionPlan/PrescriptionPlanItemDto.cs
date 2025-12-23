namespace QuickPharmaPlus.Server.ModelsDTO.PrescriptionPlan
{
    public class PrescriptionPlanItemDto
    {
        public int? ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? Dosage { get; set; }
        public int? Quantity { get; set; }
        public DateOnly? ExpiryDate { get; set; }
        public string? Image { get; set; } 
        public decimal? Price { get; set; }
        public string? CategoryName { get; set; }
        public string? ProductTypeName { get; set; }
        public bool RequiresPrescription { get; set; }
        public object? Incompatibilities { get; set; }
    }
}
