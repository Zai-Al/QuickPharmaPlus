namespace QuickPharmaPlus.Server.ModelsDTO.WishList_Cart
{
    public class WishlistItemDto
    {
        public int ProductId { get; set; }
        public string? Name { get; set; }
        public decimal? Price { get; set; }
        public string? CategoryName { get; set; }
        public string? ProductTypeName { get; set; }
        public bool RequiresPrescription { get; set; }
        public int InventoryCount { get; set; }
        public string StockStatus { get; set; } = "IN_STOCK";
    }
}
