namespace QuickPharmaPlus.Server.ModelsDTO.Product
{
    public class CustomerProductListDto
    {
        public int Id { get; set; }

        public string? Name { get; set; }

        public decimal? Price { get; set; }

        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }

        public int? ProductTypeId { get; set; }
        public string? ProductTypeName { get; set; }

        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }

        /// <summary>
        /// True if this product needs a prescription (mapped from IsControlled).
        /// </summary>
        public bool RequiresPrescription { get; set; }

        /// <summary>
        /// "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"
        /// </summary>
        public string StockStatus { get; set; } = "OUT_OF_STOCK";

        /// <summary>
        /// Total inventory units across all branches (for now).
        /// </summary>
        public int InventoryCount { get; set; }

        /// <summary>
        /// Placeholder for future incompatibility info (for now null/empty).
        /// Later can become a proper object with meds/allergies/illness.
        /// </summary>
        public object? Incompatibilities { get; set; }

        public string? ProductImageBase64 { get; set; }

    }
}
