namespace QuickPharmaPlus.Server.ModelsDTO.Checkout
{
    public class AvailableSlotsByDateDto
    {
        public DateOnly Date { get; set; }
        public List<AvailableSlotDto> Slots { get; set; } = new();
    }
}
