namespace QuickPharmaPlus.Server.ModelsDTO.Product
{
    public class ProductDetailWithInteractionsDto
    {
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? ProductDescription { get; set; }
        public decimal? ProductPrice { get; set; }
        public bool? IsControlled { get; set; }
        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public int? ProductTypeId { get; set; }
        public string? ProductTypeName { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public byte[]? ProductImage { get; set; }
        
        // List of ingredients for this product
        public List<IngredientDto>? Ingredients { get; set; } = new List<IngredientDto>();
        
        // List of known interactions for this product's ingredients
        public List<ProductInteractionDto>? KnownInteractions { get; set; } = new List<ProductInteractionDto>();
    }

    public class IngredientDto
    {
        public int? IngredientId { get; set; }
        public string? IngredientName { get; set; }
    }

    public class ProductInteractionDto
    {
        public string? IngredientAName { get; set; }
        public string? IngredientBName { get; set; }
        public string? InteractionTypeName { get; set; }
        public string? InteractionDescription { get; set; }
    }
}