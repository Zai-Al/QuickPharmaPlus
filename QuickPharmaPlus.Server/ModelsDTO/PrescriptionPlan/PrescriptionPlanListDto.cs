namespace QuickPharmaPlus.Server.ModelsDTO.PrescriptionPlan
{
    public class PrescriptionPlanListDto
    {
        public int PrescriptionPlanId { get; set; }
        public string? Name { get; set; }              // Prescription name
        public string? Status { get; set; }            // Ongoing / Expired / Cancelled
        public string? CreationDate { get; set; }      // "yyyy-MM-dd"

        public ShippingDto Shipping { get; set; } = new();

        // items shown in PlanDetails table
        public List<PrescriptionPlanItemDto> Items { get; set; } = new();
    }

    public class ShippingDto
    {
        public string? Method { get; set; }
        public int? BranchId { get; set; } 
        public string? PickupBranch { get; set; }      // "Branch #5" (or name later)
        public AddressDto? Address { get; set; }
    }

    public class AddressDto
    {
        public string? City { get; set; }
        public string? Block { get; set; }
        public string? Road { get; set; }
        public string? BuildingFloor { get; set; }
    }
}
