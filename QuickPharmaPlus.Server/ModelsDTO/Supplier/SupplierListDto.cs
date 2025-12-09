using QuickPharmaPlus.Server.ModelsDTO.Address;

namespace QuickPharmaPlus.Server.ModelsDTO.Supplier
{
    public class SupplierListDto
    {
        public int SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public string? Representative { get; set; }
        public string? Contact { get; set; }
        public string? Email { get; set; }
        public int? AddressId { get; set; }
        public int ProductCount { get; set; }

        public AddressDto? Address { get; set; }

    }
}
