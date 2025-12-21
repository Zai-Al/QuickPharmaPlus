namespace QuickPharmaPlus.Server.ModelsDTO.Reorder
{
    public class ReorderCreateDto
    {
        public int? SupplierId { get; set; }
        public int? ProductId { get; set; }
        public int? Quantity { get; set; }
        public int? Threshold { get; set; }
        public int? BranchId { get; set; } // Optional - for admin only
    }
}