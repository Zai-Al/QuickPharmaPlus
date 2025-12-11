using QuickPharmaPlus.Server.ModelsDTO.Address;

namespace QuickPharmaPlus.Server.ModelsDTO.Inventory
{
    public class InventoryListDto
    {
        public int InventoryId { get; set; }
        public int? ProductId { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }
        public DateOnly? ExpiryDate { get; set; }
        public int? BranchId { get; set; }

        // Branch address payload (use existing AddressDto)
        public AddressDto? Address { get; set; }
    }
}