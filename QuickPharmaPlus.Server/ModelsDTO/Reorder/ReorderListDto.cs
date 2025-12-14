namespace QuickPharmaPlus.Server.ModelsDTO.Reorder
{
    public class ReorderListDto
    {
        public int ReorderId { get; set; }
        public int? ReorderThreshold { get; set; }
        
        public int? ProductId { get; set; }
        public string? ProductName { get; set; }
        
        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }
        
        public int? UserId { get; set; }
        public string? UserFullName { get; set; }
    }
}
