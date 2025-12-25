namespace QuickPharmaPlus.Server.ModelsDTO.Report
{
    public sealed class CategoryTypeProductRevenueRowDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = "";

        public int OrdersCount { get; set; }
        public int UnitsSold { get; set; }
        public decimal Revenue { get; set; }
    }
}