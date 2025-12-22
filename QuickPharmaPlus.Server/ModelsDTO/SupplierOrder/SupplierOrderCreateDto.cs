namespace QuickPharmaPlus.Server.ModelsDTO.SupplierOrder
{
    public class SupplierOrderCreateDto
    {
        public int? SupplierId { get; set; }
        public int? ProductId { get; set; }
        public int? Quantity { get; set; }
        public int? BranchId { get; set; } // Only used by Admin
    }
}