namespace QuickPharmaPlus.Server.ModelsDTO.Inventory
{
    public class ExpiredInventoryListDto
    {
        public int InventoryId { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }
        public DateOnly? ExpiryDate { get; set; }
        public string? SupplierName { get; set; }
        public string? CategoryName { get; set; }
        public string? ProductType { get; set; }
        public string? BranchCity { get; set; }
        public int? BranchId { get; set; }
    }
}