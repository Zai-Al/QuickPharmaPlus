namespace QuickPharmaPlus.Server.ModelsDTO.Report
{
    public sealed class CategoryTypeRevenueRowDto
    {
        public int ProductTypeId { get; set; }
        public string ProductTypeName { get; set; } = "";

        public int OrdersCount { get; set; }
        public int UnitsSold { get; set; }
        public decimal Revenue { get; set; }

        public List<CategoryTypeProductRevenueRowDto> Products { get; set; } = new();
    }
}