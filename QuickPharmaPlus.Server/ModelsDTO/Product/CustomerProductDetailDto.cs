namespace QuickPharmaPlus.Server.ModelsDTO.Product
{
    public class CustomerProductDetailDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }

        public decimal? Price { get; set; }
        public string? Description { get; set; }

        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }

        public int? ProductTypeId { get; set; }
        public string? ProductTypeName { get; set; }

        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }

        public bool RequiresPrescription { get; set; }

        public string StockStatus { get; set; } = "OUT_OF_STOCK";
        public int InventoryCount { get; set; }

        // If your ProductImage is byte[] in DB/entity, return base64:
        public string? ProductImageBase64 { get; set; }

        public object? Incompatibilities { get; set; } // keep same pattern for later
    }
}
