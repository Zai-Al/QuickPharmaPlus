namespace QuickPharmaPlus.Server.ModelsDTO.Order
{
    public class MyOrderListDto
    {
        public int OrderId { get; set; }
        public DateTime? OrderCreationDate { get; set; }
        public decimal? OrderTotal { get; set; }

        public int? OrderStatusId { get; set; }
        public string? OrderStatusName { get; set; }

        public bool? IsDelivery { get; set; }
        public DateTime? ShippingDate { get; set; }
        public int? SlotId { get; set; }
        public string? SlotName { get; set; }

        public string? PaymentMethodName { get; set; }
    }
}
