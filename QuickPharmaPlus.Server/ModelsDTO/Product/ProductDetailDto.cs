using System;

namespace QuickPharmaPlus.Server.ModelsDTO.Product
{
    public class ProductDetailDto
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

        // Include product image bytes so the API can return the stored image.
        // The client may convert to base64 or handle binary response as needed.
        public byte[]? ProductImage { get; set; }
    }
}