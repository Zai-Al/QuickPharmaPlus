namespace QuickPharmaPlus.Server.ModelsDTO.Report
{
    public sealed class ProductRevenueReportDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = "";

        public string? ProductDescription { get; set; }
        public decimal? ProductPrice { get; set; }
        public bool? IsControlled { get; set; }

        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }

        public int? ProductTypeId { get; set; }
        public string? ProductTypeName { get; set; }

        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }

        public string ScopeLabel { get; set; } = "";
        public DateOnly DateFrom { get; set; }
        public DateOnly DateTo { get; set; }

        public List<ProductIngredientRowDto> Ingredients { get; set; } = new();
        public List<ProductInteractionRowDto> KnownInteractions { get; set; } = new();

        public TotalRevenueKpisDto Kpis { get; set; } = new();
        public List<BranchRevenueKpiDto> BranchKpis { get; set; } = new();

        public List<SupplierOrderCostRowDto> SupplierOrders { get; set; } = new();
        public List<ReorderCostRowDto> Reorders { get; set; } = new();

        public List<ProductSalesOrderRowDto> Orders { get; set; } = new();
    }

    public sealed class ProductIngredientRowDto
    {
        public int IngredientId { get; set; }
        public string IngredientName { get; set; } = "";
    }

    public sealed class ProductInteractionRowDto
    {
        public string IngredientAName { get; set; } = "";
        public string IngredientBName { get; set; } = "";
        public string InteractionTypeName { get; set; } = "";
        public string? InteractionDescription { get; set; }
    }

    public sealed class ProductSalesOrderRowDto
    {
        public int OrderId { get; set; }
        public DateTime? OrderCreationDate { get; set; }

        public string? CustomerName { get; set; }
        public string? BranchName { get; set; }

        public bool? IsDelivery { get; set; }
        public bool? IsUrgent { get; set; }

        public int UnitsSold { get; set; }
        public decimal ProductLineRevenue { get; set; }
    }
}   