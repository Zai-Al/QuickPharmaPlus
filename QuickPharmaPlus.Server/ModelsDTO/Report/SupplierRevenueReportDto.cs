namespace QuickPharmaPlus.Server.ModelsDTO.Report;

public sealed class SupplierRevenueReportDto
{
    public required int SupplierId { get; init; }
    public required string SupplierName { get; init; }

    public string SupplierContact { get; init; } = "";
    public string SupplierEmail { get; init; } = "";
    public string SupplierRepresentative { get; init; } = "";

    public required string ScopeLabel { get; init; } // "All branches" or city name
    public required DateOnly DateFrom { get; init; }
    public required DateOnly DateTo { get; init; }

    public required TotalRevenueKpisDto Kpis { get; init; }
    public List<BranchRevenueKpiDto> BranchKpis { get; init; } = new();

    public required List<SupplierProductSalesRowDto> ProductSales { get; init; }
    public required List<SupplierSalesOrderRowDto> Orders { get; init; }

    public required List<SupplierOrderCostRowDto> SupplierOrders { get; init; }
    public required List<ReorderCostRowDto> Reorders { get; init; }
}

public sealed class SupplierProductSalesRowDto
{
    public int ProductId { get; init; }
    public string ProductName { get; init; } = "";
    public int OrdersCount { get; init; }
    public int UnitsSold { get; init; }
    public decimal Revenue { get; init; }
}

public sealed class SupplierSalesOrderRowDto
{
    public int OrderId { get; init; }
    public DateTime? OrderCreationDate { get; init; }

    public string CustomerName { get; init; } = "";
    public string BranchName { get; init; } = "";

    public bool? IsDelivery { get; init; }
    public bool? IsUrgent { get; init; }

    // Supplier-only revenue inside this order (sum of this supplier’s lines)
    public decimal SupplierLineRevenue { get; init; }
}