namespace QuickPharmaPlus.Server.ModelsDTO.Order
{
    public class OrderRescheduleRequestDto
    {
        public int UserId { get; set; }
        public DateOnly ShippingDate { get; set; }
        public int SlotId { get; set; }
    }
}
