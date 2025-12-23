using System.Collections.Generic;

namespace QuickPharmaPlus.Server.ModelsDTO.Delivery
{
    public class DeliveryRequestsPagedResultDto
    {
        public List<DeliveryRequestListItemDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }
}