using QuickPharmaPlus.Server.ModelsDTO.Incompatibility;

namespace QuickPharmaPlus.Server.ModelsDTO.WishList_Cart
{
    public class CartItemDto
    {
        public int CartItemId { get; set; }
        public int ProductId { get; set; }

        public string? Name { get; set; }
        public decimal? Price { get; set; }
        public string? CategoryName { get; set; }
        public string? ProductTypeName { get; set; }

        public bool RequiresPrescription { get; set; }

        public int CartQuantity { get; set; }      // quantity in cart
        public int InventoryCount { get; set; }    // available stock
        public string StockStatus { get; set; } = "IN_STOCK";

        public CustomerIncompatibilitiesDto Incompatibilities { get; set; } = new();
    }
}
