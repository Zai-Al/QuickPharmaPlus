using System;
using System.Collections.Generic;

namespace QuickPharmaPlus.Server.ModelsDTO.Order
{
    public class MyOrderDetailsDto
    {
        public int OrderId { get; set; }
        public DateTime? OrderCreationDate { get; set; }
        public decimal? OrderTotal { get; set; }

        public int? OrderStatusId { get; set; }
        public string? OrderStatusName { get; set; }

        public bool? IsDelivery { get; set; }
        public bool? IsUrgent { get; set; }
        public DateTime? ShippingDate { get; set; }

        public int? SlotId { get; set; }
        public string? SlotName { get; set; }
        public TimeOnly? SlotStart { get; set; }
        public TimeOnly? SlotEnd { get; set; }

        public int? BranchId { get; set; }
        public string? BranchName { get; set; }

        public string? PaymentMethodName { get; set; }

        public List<MyOrderItemDto> Items { get; set; } = new();
    }
}
