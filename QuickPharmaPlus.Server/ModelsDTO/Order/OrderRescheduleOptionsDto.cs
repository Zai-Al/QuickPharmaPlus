using QuickPharmaPlus.Server.ModelsDTO.Checkout;

namespace QuickPharmaPlus.Server.ModelsDTO.Order
{
    public class OrderRescheduleOptionsDto
    {
        public DateOnly MinDate { get; set; }
        public DateOnly MaxDate { get; set; }
        public List<AvailableSlotsByDateDto> Days { get; set; } = new();
    }
}
