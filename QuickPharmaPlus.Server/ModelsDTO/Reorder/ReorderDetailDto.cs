namespace QuickPharmaPlus.Server.ModelsDTO.Reorder
{
    public class ReorderDetailDto
    {
        public int ReorderId { get; set; }
        public int? ReorderThreshold { get; set; }

        public int? ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? ProductDescription { get; set; }
        
        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public string? SupplierContact { get; set; }
        public string? SupplierEmail { get; set; }
        
        public int? UserId { get; set; }
        public string? UserFullName { get; set; }
        public string? UserEmail { get; set; }
        
        public int BranchId { get; set; }
        public string? BranchName { get; set; }
        public int? ReoderQuantity { get; internal set; }
    }
}
