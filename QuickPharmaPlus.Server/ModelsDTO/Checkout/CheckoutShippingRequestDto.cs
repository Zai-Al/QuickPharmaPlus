namespace QuickPharmaPlus.Server.ModelsDTO.Checkout
{
    public class CheckoutShippingRequestDto
    {
        public int UserId { get; set; }

        // "pickup" | "delivery"
        public string Mode { get; set; } = "pickup";

        // pickup
        public int? PickupBranchId { get; set; }

        // delivery
        public bool UseSavedAddress { get; set; } = false;
        public int? CityId { get; set; }              // required if UseSavedAddress=false (or for mapping)
        public string? Block { get; set; }
        public string? Road { get; set; }
        public string? BuildingFloor { get; set; }

        // delivery schedule
        public bool IsUrgent { get; set; } = false;
        public DateOnly? ShippingDate { get; set; }   // only when IsUrgent=false
        public int? SlotId { get; set; }              // only when IsUrgent=false

        public List<CheckoutCartItemDto> Items { get; set; } = new();
    }
}
