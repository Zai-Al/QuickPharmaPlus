namespace QuickPharmaPlus.Server.ModelsDTO.Delivery
{
    public class DeliveryRequestListItemDto
    {
        public int ShippingId { get; set; }
        public int OrderId { get; set; }

        public string Location { get; set; } = string.Empty;

        public string PaymentMethod { get; set; } = string.Empty;
        public bool IsPaymentSuccessful { get; set; }

        public string SlotName { get; set; } = string.Empty;
        public bool IsUrgent { get; set; }

        public int OrderStatusId { get; set; }
        public string OrderStatusName { get; set; } = string.Empty;

        public int CustomerUserId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
    }
}