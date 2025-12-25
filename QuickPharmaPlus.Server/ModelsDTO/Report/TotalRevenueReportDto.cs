namespace QuickPharmaPlus.Server.ModelsDTO.Report;

public sealed class TotalRevenueReportDto
{
    public required string ScopeLabel { get; init; }
    public required DateOnly DateFrom { get; init; }
    public required DateOnly DateTo { get; init; }

    public required TotalRevenueKpisDto Kpis { get; init; }

    public List<BranchRevenueKpiDto> BranchKpis { get; init; } = new();

    public required List<SalesBySupplierRowDto> SalesBySupplier { get; init; }
    public required List<SalesByCategoryRowDto> SalesByCategory { get; init; }

    public required List<SalesByProductRowDto> SalesByProduct { get; init; }
    public required List<OrderListRowDto> Orders { get; init; }

    public required List<DeliveryRequestRowDto> DeliveryRequests { get; init; }

    public required List<SupplierOrderCostRowDto> SupplierOrders { get; init; }
    public required List<ReorderCostRowDto> Reorders { get; init; }
}

public sealed class TotalRevenueKpisDto
{
    public decimal SuccessfulPaymentsTotal { get; init; }
    public int SuccessfulPaymentsCount { get; init; }

    public decimal UnsuccessfulPaymentsTotal { get; init; }
    public int UnsuccessfulPaymentsCount { get; init; }

    public int OrdersWithMissingPaymentCount { get; init; }

    // Accurate revenue using ProductPrice * Quantity for successful paid orders
    public decimal LineRevenueTotal { get; init; }
}

public sealed class SalesBySupplierRowDto
{
    public int SupplierId { get; init; }
    public string SupplierName { get; init; } = "";
    public int OrdersCount { get; init; }
    public int UnitsSold { get; init; }
    public decimal Revenue { get; init; }
}

public sealed class SalesByCategoryRowDto
{
    public int CategoryId { get; init; }
    public string CategoryName { get; init; } = "";
    public int OrdersCount { get; init; }
    public int UnitsSold { get; init; }
    public decimal Revenue { get; init; }
}

public sealed class SalesByProductRowDto
{
    public int ProductId { get; init; }
    public string ProductName { get; init; } = "";
    public int OrdersCount { get; init; }
    public int UnitsSold { get; init; }

    // As requested: "profit" = ProductPrice × Quantity (revenue)
    public decimal Profit { get; init; }
}

public sealed class OrderListRowDto
{
    public int OrderId { get; init; }
    public DateTime? OrderCreationDate { get; init; }

    public int? CustomerUserId { get; init; }
    public string CustomerName { get; init; } = "";

    public bool? PaymentIsSuccessful { get; init; }
    public decimal? OrderTotal { get; init; }

    public bool? IsDelivery { get; init; }
    public bool? IsUrgent { get; init; }
    public DateTime? ShippingDate { get; init; }
    public string SlotName { get; init; } = "";
    public string BranchName { get; init; } = "";
}

public sealed class DeliveryRequestRowDto
{
    public int OrderId { get; init; }
    public int ShippingId { get; init; }

    public string CustomerName { get; init; } = "";
    public string CustomerPhone { get; init; } = "";
    public string CustomerEmail { get; init; } = "";

    public string Location { get; init; } = "";
    public bool IsUrgent { get; init; }
    public string SlotName { get; init; } = "";

    public string OrderStatusName { get; init; } = "";
    public string PaymentMethod { get; init; } = "";
    public bool IsPaymentSuccessful { get; init; }
}

public sealed class SupplierOrderCostRowDto
{
    public int SupplierOrderId { get; init; }
    public DateTime? SupplierOrderDate { get; init; }

    public string SupplierName { get; init; } = "";
    public string ProductName { get; init; } = "";
    public string BranchName { get; init; } = "";

    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal TotalCost { get; init; }
}

public sealed class ReorderCostRowDto
{
    public int ReorderId { get; init; }

    public string ProductName { get; init; } = "";
    public string SupplierName { get; init; } = "";
    public string BranchName { get; init; } = "";

    public int? Threshold { get; init; }
    public int Quantity { get; init; }

    public decimal UnitPrice { get; init; }
    public decimal TotalCost { get; init; }
}

public sealed class BranchRevenueKpiDto
{
    public int BranchId { get; init; }
    public string BranchName { get; init; } = "";

    public TotalRevenueKpisDto Kpis { get; init; } = new();
}