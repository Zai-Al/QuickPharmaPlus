namespace QuickPharmaPlus.Server.ModelsDTO.Order
{
    public class MyOrderItemDto
    {
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? CategoryName { get; set; }
        public string? ProductTypeName { get; set; }
        public decimal? Price { get; set; }
        public int Quantity { get; set; }
        public string? Image { get; set; }
        public bool? IsControlled { get; set; }
    }
}
