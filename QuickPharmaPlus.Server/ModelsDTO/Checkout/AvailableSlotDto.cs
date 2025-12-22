namespace QuickPharmaPlus.Server.ModelsDTO.Checkout
{
    public class AvailableSlotDto
    {
        public int SlotId { get; set; }
        public string SlotName { get; set; } = "";
        public TimeOnly? Start { get; set; }
        public TimeOnly? End { get; set; }
        public string? Description { get; set; }
    }

    public class UrgentAvailabilityDto
    {
        public bool Available { get; set; }
        public int? SlotId { get; set; }          
        public string? Reason { get; set; }       
    }
}
