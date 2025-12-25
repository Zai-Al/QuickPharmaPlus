namespace QuickPharmaPlus.Server.ModelsDTO.Report
{
    public sealed class CategorySalesOrderRowDto
    {
        public int OrderId { get; set; }
        public DateTime? OrderCreationDate { get; set; }

        public string? CustomerName { get; set; }
        public string? BranchName { get; set; }

        public bool? IsDelivery { get; set; }
        public bool? IsUrgent { get; set; }

        public decimal CategoryLineRevenue { get; set; }
    }
}