namespace QuickPharmaPlus.Server.ModelsDTO.PrescriptionPlan
{
    public class PrescriptionPlanUpsertDto
    {
        public int PrescriptionId { get; set; } // ignored on update

        // "pickup" | "delivery"
        public string Method { get; set; } = "";

        // pickup
        public int? BranchId { get; set; }

        // delivery
        public int? CityId { get; set; }
        public string? Block { get; set; }
        public string? Road { get; set; }
        public string? BuildingFloor { get; set; }

        public decimal SubtotalAmount { get; set; }
        public decimal DeliveryFee { get; set; }   // 0 or 1
        public decimal TotalAmount { get; set; }
    }
}
