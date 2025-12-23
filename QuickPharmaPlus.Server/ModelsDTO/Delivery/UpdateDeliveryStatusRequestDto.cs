namespace QuickPharmaPlus.Server.ModelsDTO.Delivery
{
    public class UpdateDeliveryStatusRequestDto
    {
        public int NewStatusId { get; set; }

        // Only meaningful when completing delivery (status = 3).
        // If true AND payment method is cash, we'll set PaymentIsSuccessful=true.
        public bool MarkCashPaymentSuccessful { get; set; }
    }
}