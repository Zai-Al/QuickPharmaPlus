using System;

namespace QuickPharmaPlus.Server.ModelsDTO.Product
{
    public class ProductListDto
    {
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public decimal? ProductPrice { get; set; }
        public bool? IsControlled { get; set; }

        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }

        public int? ProductTypeId { get; set; }
        public string? ProductTypeName { get; set; }

        public int CategoryId { get; set; }
        public string? CategoryName { get; set; }

        // optional summary fields
        public int InventoryCount { get; set; }
    }
}
