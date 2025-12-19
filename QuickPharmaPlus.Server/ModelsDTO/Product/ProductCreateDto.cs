using Microsoft.AspNetCore.Http;

namespace QuickPharmaPlus.Server.ModelsDTO.Product
{
    public class ProductCreateDto
    {
        public string? ProductName { get; set; }
        public string? ProductDescription { get; set; }
        public int? SupplierId { get; set; }
        public int? CategoryId { get; set; }
        public int? ProductTypeId { get; set; }
        public decimal? ProductPrice { get; set; }
        public bool IsControlled { get; set; }
        public IFormFile? ProductImage { get; set; }
        
        // NEW: List of ingredient IDs
        public List<int>? IngredientIds { get; set; }
    }
}