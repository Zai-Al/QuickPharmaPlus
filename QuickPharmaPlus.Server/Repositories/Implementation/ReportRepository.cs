using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Report;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class ReportRepository : IReportRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        private static readonly Regex ValidNamePattern = new(@"^[A-Za-z0-9 .\-+]*$");
        private static readonly Regex ValidIdPattern = new(@"^[0-9]*$");

        public ReportRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        public async Task<int?> ResolveReportTypeIdAsync(string reportTypeName)
        {
            if (string.IsNullOrWhiteSpace(reportTypeName)) return null;
            var name = reportTypeName.Trim();

            return await _context.ReportTypes
                .AsNoTracking()
                .Where(x => x.ReportTypeName != null && x.ReportTypeName == name)
                .Select(x => (int?)x.ReportTypeId)
                .FirstOrDefaultAsync();
        }

        public async Task<TotalRevenueReportDto> BuildTotalRevenueReportAsync(DateOnly from, DateOnly to, int? branchId)
        {
            var fromDt = from.ToDateTime(TimeOnly.MinValue);
            var toDt = to.ToDateTime(TimeOnly.MaxValue);

            var scopeLabel = "All branches";
            if (branchId.HasValue)
            {
                var cityName = await _context.Branches
                    .AsNoTracking()
                    .Where(b => b.BranchId == branchId.Value)
                    .Select(b => b.Address != null && b.Address.City != null ? b.Address.City.CityName : null)
                    .FirstOrDefaultAsync();

                scopeLabel = !string.IsNullOrWhiteSpace(cityName) ? cityName : $"Branch {branchId.Value}";
            }

            var orders = _context.Orders
                .AsNoTracking()
                .Include(o => o.Shipping)
                .Include(o => o.Payment)
                .AsQueryable();

            if (branchId.HasValue)
            {
                orders = orders.Where(o => o.Shipping != null && o.Shipping.BranchId == branchId.Value);
            }

            // KPI: successful/unsuccessful are still timestamp based in your codebase
            var successfulByPaymentTs = orders.Where(o =>
                o.Payment != null &&
                o.Payment.PaymentIsSuccessful == true &&
                o.Payment.PaymentTimestamp.HasValue &&
                o.Payment.PaymentTimestamp.Value >= fromDt &&
                o.Payment.PaymentTimestamp.Value <= toDt);

            var unsuccessfulByPaymentTs = orders.Where(o =>
                o.Payment != null &&
                o.Payment.PaymentIsSuccessful == false &&
                o.Payment.PaymentTimestamp.HasValue &&
                o.Payment.PaymentTimestamp.Value >= fromDt &&
                o.Payment.PaymentTimestamp.Value <= toDt);

            var successfulPaymentsTotal = await successfulByPaymentTs
                .Where(o => o.OrderTotal.HasValue)
                .SumAsync(o => o.OrderTotal!.Value);

            var successfulPaymentsCount = await successfulByPaymentTs.CountAsync();

            var unsuccessfulPaymentsTotal = await unsuccessfulByPaymentTs
                .Where(o => o.OrderTotal.HasValue)
                .SumAsync(o => o.OrderTotal!.Value);

            var unsuccessfulPaymentsCount = await unsuccessfulByPaymentTs.CountAsync();

            var ordersWithMissingPaymentCount = await orders
                .Where(o =>
                    !o.PaymentId.HasValue &&
                    o.OrderCreationDate.HasValue &&
                    o.OrderCreationDate.Value >= fromDt &&
                    o.OrderCreationDate.Value <= toDt)
                .CountAsync();

            // Detailed tables: successful paid orders only, filtered by OrderCreationDate
            var successfulOrdersByCreation = orders.Where(o =>
                o.Payment != null &&
                o.Payment.PaymentIsSuccessful == true &&
                o.OrderCreationDate.HasValue &&
                o.OrderCreationDate.Value >= fromDt &&
                o.OrderCreationDate.Value <= toDt);

            var paidLines = from po in _context.ProductOrders.AsNoTracking()
                            join o in successfulOrdersByCreation on po.OrderId equals o.OrderId
                            select po;

            var lineRevenueTotal = await paidLines
                .Include(po => po.Product)
                .Where(po => po.Product != null && po.Product.ProductPrice.HasValue)
                .SumAsync(po => po.Product!.ProductPrice!.Value * po.Quantity);

            // ============================================================
            // Sales aggregates (only where there are sales)
            // ============================================================

            var supplierAgg = await paidLines
                .Include(po => po.Product)
                .Where(po => po.Product != null && po.Product.SupplierId.HasValue && po.Product.ProductPrice.HasValue)
                .GroupBy(po => po.Product!.SupplierId!.Value)
                .Select(g => new
                {
                    SupplierId = g.Key,
                    OrdersCount = g.Select(x => x.OrderId!.Value).Distinct().Count(),
                    UnitsSold = g.Sum(x => x.Quantity),
                    Revenue = g.Sum(x => x.Product!.ProductPrice!.Value * x.Quantity)
                })
                .ToListAsync();

            var categoryAgg = await paidLines
                .Include(po => po.Product)
                .Where(po => po.Product != null && po.Product.CategoryId.HasValue && po.Product.ProductPrice.HasValue)
                .GroupBy(po => po.Product!.CategoryId!.Value)
                .Select(g => new
                {
                    CategoryId = g.Key,
                    OrdersCount = g.Select(x => x.OrderId!.Value).Distinct().Count(),
                    UnitsSold = g.Sum(x => x.Quantity),
                    Revenue = g.Sum(x => x.Product!.ProductPrice!.Value * x.Quantity)
                })
                .ToListAsync();

            var productAgg = await paidLines
                .Include(po => po.Product)
                .Where(po => po.Product != null && po.Product.ProductPrice.HasValue)
                .GroupBy(po => po.Product!.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    OrdersCount = g.Select(x => x.OrderId!.Value).Distinct().Count(),
                    UnitsSold = g.Sum(x => x.Quantity),
                    Profit = g.Sum(x => x.Product!.ProductPrice!.Value * x.Quantity)
                })
                .ToListAsync();

            var supplierAggMap = supplierAgg.ToDictionary(x => x.SupplierId);
            var categoryAggMap = categoryAgg.ToDictionary(x => x.CategoryId);
            var productAggMap = productAgg.ToDictionary(x => x.ProductId);

            // ============================================================
            // Dimension lists (ALL entities)
            // ============================================================

            var allSuppliers = await _context.Suppliers
                .AsNoTracking()
                .OrderBy(s => s.SupplierName ?? ("Supplier " + s.SupplierId))
                .Select(s => new
                {
                    s.SupplierId,
                    s.SupplierName
                })
                .ToListAsync();

            var allCategories = await _context.Categories
                .AsNoTracking()
                .OrderBy(c => c.CategoryName ?? ("Category " + c.CategoryId))
                .Select(c => new
                {
                    c.CategoryId,
                    c.CategoryName
                })
                .ToListAsync();

            var allProducts = await _context.Products
                .AsNoTracking()
                .OrderBy(p => p.ProductName ?? ("Product " + p.ProductId))
                .Select(p => new
                {
                    p.ProductId,
                    p.ProductName
                })
                .ToListAsync();

            // ============================================================
            // Final rows (ALL suppliers/categories/products, default 0)
            // ============================================================

            var supplierRows = allSuppliers
                .Select(s =>
                {
                    supplierAggMap.TryGetValue(s.SupplierId, out var agg);

                    return new SalesBySupplierRowDto
                    {
                        SupplierId = s.SupplierId,
                        SupplierName = string.IsNullOrWhiteSpace(s.SupplierName) ? $"Supplier {s.SupplierId}" : s.SupplierName!,
                        OrdersCount = agg?.OrdersCount ?? 0,
                        UnitsSold = agg?.UnitsSold ?? 0,
                        Revenue = agg?.Revenue ?? 0m
                    };
                })
                .OrderByDescending(x => x.Revenue)
                .ThenBy(x => x.SupplierName)
                .ToList();

            var categoryRows = allCategories
                .Select(c =>
                {
                    categoryAggMap.TryGetValue(c.CategoryId, out var agg);

                    return new SalesByCategoryRowDto
                    {
                        CategoryId = c.CategoryId,
                        CategoryName = string.IsNullOrWhiteSpace(c.CategoryName) ? $"Category {c.CategoryId}" : c.CategoryName!,
                        OrdersCount = agg?.OrdersCount ?? 0,
                        UnitsSold = agg?.UnitsSold ?? 0,
                        Revenue = agg?.Revenue ?? 0m
                    };
                })
                .OrderByDescending(x => x.Revenue)
                .ThenBy(x => x.CategoryName)
                .ToList();

            var productRows = allProducts
                .Select(p =>
                {
                    productAggMap.TryGetValue(p.ProductId, out var agg);

                    return new SalesByProductRowDto
                    {
                        ProductId = p.ProductId,
                        ProductName = string.IsNullOrWhiteSpace(p.ProductName) ? $"Product {p.ProductId}" : p.ProductName!,
                        OrdersCount = agg?.OrdersCount ?? 0,
                        UnitsSold = agg?.UnitsSold ?? 0,
                        Profit = agg?.Profit ?? 0m
                    };
                })
                .OrderByDescending(x => x.Profit)
                .ThenBy(x => x.ProductName)
                .ToList();

            // Orders list / delivery requests / supplier orders / reorders:
            // keep your existing implementation below (unchanged)

            // NEW: Orders list (successful paid orders only)
            var ordersList = await _context.Orders
                .AsNoTracking()
                .Where(o => successfulOrdersByCreation.Select(x => x.OrderId).Contains(o.OrderId))
                .Include(o => o.User)
                .Include(o => o.OrderStatus)
                .Include(o => o.Payment)
                .Include(o => o.Shipping)!.ThenInclude(s => s.ShippingSlot)
                .Include(o => o.Shipping)!.ThenInclude(s => s.Branch)!.ThenInclude(b => b.Address)!.ThenInclude(a => a.City)
                .OrderBy(o => o.OrderCreationDate)
                .ThenBy(o => o.OrderId)
                .Select(o => new OrderListRowDto
                {
                    OrderId = o.OrderId,
                    OrderCreationDate = o.OrderCreationDate,
                    CustomerUserId = o.UserId,
                    CustomerName = o.User != null ? ((o.User.FirstName ?? "") + " " + (o.User.LastName ?? "")).Trim() : "",
                    PaymentIsSuccessful = o.Payment != null ? o.Payment.PaymentIsSuccessful : null,
                    OrderTotal = o.OrderTotal,
                    IsDelivery = o.Shipping != null ? o.Shipping.ShippingIsDelivery : null,
                    IsUrgent = o.Shipping != null ? o.Shipping.ShippingIsUrgent : null,
                    ShippingDate = o.Shipping != null ? o.Shipping.ShippingDate : null,
                    SlotName = (o.Shipping != null && o.Shipping.ShippingSlot != null) ? o.Shipping.ShippingSlot.SlotName : "",
                    BranchName = (o.Shipping != null && o.Shipping.Branch != null && o.Shipping.Branch.Address != null && o.Shipping.Branch.Address.City != null)
                        ? o.Shipping.Branch.Address.City.CityName!
                        : ""
                })
                .ToListAsync();

            var deliveryRequests = await _context.Orders
                .AsNoTracking()
                .Where(o =>
                    o.Payment != null &&
                    o.Payment.PaymentIsSuccessful == true &&
                    o.OrderCreationDate.HasValue &&
                    o.OrderCreationDate.Value >= fromDt &&
                    o.OrderCreationDate.Value <= toDt &&
                    o.Shipping != null &&
                    o.Shipping.ShippingIsDelivery == true)
                .Include(o => o.User)
                .Include(o => o.OrderStatus)
                .Include(o => o.Payment)!.ThenInclude(p => p.PaymentMethod)
                .Include(o => o.Shipping)!.ThenInclude(s => s.ShippingSlot)
                .Include(o => o.Shipping)!.ThenInclude(s => s.Address)!.ThenInclude(a => a.City)
                .OrderBy(o => o.OrderCreationDate)
                .ThenBy(o => o.OrderId)
                .Select(o => new DeliveryRequestRowDto
                {
                    OrderId = o.OrderId,
                    ShippingId = o.Shipping!.ShippingId,
                    CustomerName = o.User != null ? ((o.User.FirstName ?? "") + " " + (o.User.LastName ?? "")).Trim() : "",
                    CustomerPhone = o.User != null ? (o.User.ContactNumber ?? "") : "",
                    CustomerEmail = o.User != null ? (o.User.EmailAddress ?? "") : "",
                    Location =
                        (o.Shipping!.Address != null
                            ? $"{o.Shipping.Address.Block}, {o.Shipping.Address.Street}, {o.Shipping.Address.BuildingNumber}"
                            : ""),
                    IsUrgent = o.Shipping.ShippingIsUrgent == true,
                    SlotName = o.Shipping.ShippingSlot != null ? o.Shipping.ShippingSlot.SlotName : "",
                    OrderStatusName = o.OrderStatus != null ? (o.OrderStatus.OrderStatusName ?? "") : "",
                    PaymentMethod = (o.Payment != null && o.Payment.PaymentMethod != null) ? (o.Payment.PaymentMethod.PaymentMethodName ?? "") : "",
                    IsPaymentSuccessful = o.Payment != null && o.Payment.PaymentIsSuccessful == true
                })
                .ToListAsync();

            var supplierOrdersQuery = _context.SupplierOrders
                .AsNoTracking()
                .Include(so => so.Supplier)
                .Include(so => so.Product)
                .Include(so => so.Branch)!.ThenInclude(b => b.Address)!.ThenInclude(a => a.City)
                .Where(so =>
                    so.SupplierOrderDate.HasValue &&
                    so.SupplierOrderDate.Value >= fromDt &&
                    so.SupplierOrderDate.Value <= toDt);

            if (branchId.HasValue)
            {
                supplierOrdersQuery = supplierOrdersQuery.Where(so => so.BranchId == branchId.Value);
            }

            var supplierOrders = await supplierOrdersQuery
                .OrderBy(so => so.SupplierOrderDate)
                .ThenBy(so => so.SupplierOrderId)
                .Select(so => new SupplierOrderCostRowDto
                {
                    SupplierOrderId = so.SupplierOrderId,
                    SupplierOrderDate = so.SupplierOrderDate,
                    SupplierName = so.Supplier != null ? (so.Supplier.SupplierName ?? "") : "",
                    ProductName = so.Product != null ? (so.Product.ProductName ?? "") : "",
                    BranchName = (so.Branch != null && so.Branch.Address != null && so.Branch.Address.City != null)
                        ? (so.Branch.Address.City.CityName ?? "")
                        : "",
                    Quantity = so.SupplierOrderQuantity ?? 0,
                    UnitPrice = so.Product != null ? (so.Product.ProductPrice ?? 0m) : 0m,
                    TotalCost = (so.Product != null ? (so.Product.ProductPrice ?? 0m) : 0m) * (so.SupplierOrderQuantity ?? 0)
                })
                .ToListAsync();

            var reordersQuery = _context.Reorders
                .AsNoTracking()
                .Include(r => r.Product)
                .Include(r => r.Supplier)
                .Include(r => r.Branch)!.ThenInclude(b => b.Address)!.ThenInclude(a => a.City)
                .AsQueryable();

            if (branchId.HasValue)
            {
                reordersQuery = reordersQuery.Where(r => r.BranchId == branchId.Value);
            }

            var reorders = await reordersQuery
                .OrderBy(r => r.ReorderId)
                .Select(r => new ReorderCostRowDto
                {
                    ReorderId = r.ReorderId,
                    ProductName = r.Product != null ? (r.Product.ProductName ?? "") : "",
                    SupplierName = r.Supplier != null ? (r.Supplier.SupplierName ?? "") : "",
                    BranchName = (r.Branch != null && r.Branch.Address != null && r.Branch.Address.City != null)
                        ? (r.Branch.Address.City.CityName ?? "")
                        : "",
                    Threshold = r.ReorderThershold,
                    Quantity = r.ReorderQuantity ?? 0,
                    UnitPrice = r.Product != null ? (r.Product.ProductPrice ?? 0m) : 0m,
                    TotalCost = (r.Product != null ? (r.Product.ProductPrice ?? 0m) : 0m) * (r.ReorderQuantity ?? 0)
                })
                .ToListAsync();

            return new TotalRevenueReportDto
            {
                ScopeLabel = scopeLabel,
                DateFrom = from,
                DateTo = to,
                Kpis = new TotalRevenueKpisDto
                {
                    SuccessfulPaymentsTotal = successfulPaymentsTotal,
                    SuccessfulPaymentsCount = successfulPaymentsCount,
                    UnsuccessfulPaymentsTotal = unsuccessfulPaymentsTotal,
                    UnsuccessfulPaymentsCount = unsuccessfulPaymentsCount,
                    OrdersWithMissingPaymentCount = ordersWithMissingPaymentCount,
                    LineRevenueTotal = lineRevenueTotal
                },
                SalesBySupplier = supplierRows,
                SalesByCategory = categoryRows,
                SalesByProduct = productRows,
                Orders = ordersList,
                DeliveryRequests = deliveryRequests,
                SupplierOrders = supplierOrders,
                Reorders = reorders
            };
        }

        public async Task<SupplierRevenueReportDto> BuildSupplierRevenueReportAsync(DateOnly from, DateOnly to, int supplierId, int? branchId)
        {
            var fromDt = from.ToDateTime(TimeOnly.MinValue);
            var toDt = to.ToDateTime(TimeOnly.MaxValue);

            var supplierInfo = await _context.Suppliers
                .AsNoTracking()
                .Where(s => s.SupplierId == supplierId)
                .Select(s => new
                {
                    s.SupplierId,
                    s.SupplierName,
                    s.SupplierContact,
                    s.SupplierEmail,
                    s.SupplierRepresentative
                })
                .FirstOrDefaultAsync();

            if (supplierInfo == null)
                throw new InvalidOperationException("SUPPLIER_NOT_FOUND");

            var scopeLabel = "All branches";
            if (branchId.HasValue)
            {
                var cityName = await _context.Branches
                    .AsNoTracking()
                    .Where(b => b.BranchId == branchId.Value)
                    .Select(b => b.Address != null && b.Address.City != null ? b.Address.City.CityName : null)
                    .FirstOrDefaultAsync();

                scopeLabel = !string.IsNullOrWhiteSpace(cityName) ? cityName : $"Branch {branchId.Value}";
            }

            var orders = _context.Orders
                .AsNoTracking()
                .Include(o => o.Shipping)
                .Include(o => o.Payment)
                .AsQueryable();

            if (branchId.HasValue)
            {
                orders = orders.Where(o => o.Shipping != null && o.Shipping.BranchId == branchId.Value);
            }

            // Orders that contain at least one product from this supplier
            var supplierOrderIds = _context.ProductOrders
                .AsNoTracking()
                .Include(po => po.Product)
                .Where(po => po.OrderId.HasValue && po.Product != null && po.Product.SupplierId == supplierId)
                .Select(po => po.OrderId!.Value)
                .Distinct();

            // KPI (PaymentTimestamp-based, like TotalRevenue KPI)
            var successfulOrdersByPaymentTs = orders.Where(o =>
                o.Payment != null &&
                o.Payment.PaymentIsSuccessful == true &&
                o.Payment.PaymentTimestamp.HasValue &&
                o.Payment.PaymentTimestamp.Value >= fromDt &&
                o.Payment.PaymentTimestamp.Value <= toDt &&
                supplierOrderIds.Contains(o.OrderId));

            var unsuccessfulOrdersByPaymentTs = orders.Where(o =>
                o.Payment != null &&
                o.Payment.PaymentIsSuccessful == false &&
                o.Payment.PaymentTimestamp.HasValue &&
                o.Payment.PaymentTimestamp.Value >= fromDt &&
                o.Payment.PaymentTimestamp.Value <= toDt &&
                supplierOrderIds.Contains(o.OrderId));

            // Supplier-only lines for KPI successful
            var successfulSupplierLines =
                from po in _context.ProductOrders.AsNoTracking()
                join o in successfulOrdersByPaymentTs on po.OrderId equals o.OrderId
                join p in _context.Products.AsNoTracking() on po.ProductId equals p.ProductId
                where p.SupplierId == supplierId && p.ProductPrice.HasValue
                select new { po.OrderId, po.Quantity, Price = p.ProductPrice!.Value, p.ProductId, p.ProductName };

            var successfulRevenue = await successfulSupplierLines.SumAsync(x => x.Price * x.Quantity);
            var successfulCount = await successfulOrdersByPaymentTs.Select(o => o.OrderId).Distinct().CountAsync();

            // Supplier-only lines for KPI unsuccessful
            var unsuccessfulSupplierLines =
                from po in _context.ProductOrders.AsNoTracking()
                join o in unsuccessfulOrdersByPaymentTs on po.OrderId equals o.OrderId
                join p in _context.Products.AsNoTracking() on po.ProductId equals p.ProductId
                where p.SupplierId == supplierId && p.ProductPrice.HasValue
                select new { po.OrderId, po.Quantity, Price = p.ProductPrice!.Value };

            var unsuccessfulRevenue = await unsuccessfulSupplierLines.SumAsync(x => x.Price * x.Quantity);
            var unsuccessfulCount = await unsuccessfulOrdersByPaymentTs.Select(o => o.OrderId).Distinct().CountAsync();

            // Missing payment count (OrderCreationDate-based, like TotalRevenue)
            var missingPaymentCount = await orders
                .Where(o =>
                    !o.PaymentId.HasValue &&
                    o.OrderCreationDate.HasValue &&
                    o.OrderCreationDate.Value >= fromDt &&
                    o.OrderCreationDate.Value <= toDt &&
                    supplierOrderIds.Contains(o.OrderId))
                .Select(o => o.OrderId)
                .Distinct()
                .CountAsync();

            // Lists (OrderCreationDate-based, like TotalRevenue lists)
            var successfulOrdersByCreation = orders.Where(o =>
                o.Payment != null &&
                o.Payment.PaymentIsSuccessful == true &&
                o.OrderCreationDate.HasValue &&
                o.OrderCreationDate.Value >= fromDt &&
                o.OrderCreationDate.Value <= toDt &&
                supplierOrderIds.Contains(o.OrderId));

            // Supplier-only paid lines for lists
            var paidSupplierLines =
                from po in _context.ProductOrders.AsNoTracking()
                join o in successfulOrdersByCreation on po.OrderId equals o.OrderId
                join p in _context.Products.AsNoTracking() on po.ProductId equals p.ProductId
                where p.SupplierId == supplierId && p.ProductPrice.HasValue
                select new { po.OrderId, po.Quantity, Price = p.ProductPrice!.Value, p.ProductId, p.ProductName };

            // Product list (sales by product) - FIX: no string.Format inside EF query
            var productSalesRaw = await paidSupplierLines
                .GroupBy(x => new { x.ProductId, x.ProductName })
                .Select(g => new
                {
                    g.Key.ProductId,
                    g.Key.ProductName,
                    OrdersCount = g.Select(x => x.OrderId!.Value).Distinct().Count(),
                    UnitsSold = g.Sum(x => x.Quantity),
                    Revenue = g.Sum(x => x.Price * x.Quantity)
                })
                .OrderByDescending(x => x.Revenue)
                .ThenBy(x => x.ProductName)
                .ToListAsync();

            var productSales = productSalesRaw
                .Select(x => new SupplierProductSalesRowDto
                {
                    ProductId = x.ProductId,
                    ProductName = string.IsNullOrWhiteSpace(x.ProductName) ? $"Product {x.ProductId}" : x.ProductName!,
                    OrdersCount = x.OrdersCount,
                    UnitsSold = x.UnitsSold,
                    Revenue = x.Revenue
                })
                .ToList();

            // Supplier line revenue per order
            var supplierRevenueByOrder = await paidSupplierLines
                .GroupBy(x => x.OrderId!.Value)
                .Select(g => new { OrderId = g.Key, Amount = g.Sum(x => x.Price * x.Quantity) })
                .ToListAsync();

            var supplierRevenueMap = supplierRevenueByOrder.ToDictionary(x => x.OrderId, x => x.Amount);

            var ordersList = await _context.Orders
                .AsNoTracking()
                .Where(o => successfulOrdersByCreation.Select(x => x.OrderId).Contains(o.OrderId))
                .Include(o => o.User)
                .Include(o => o.Shipping)!.ThenInclude(s => s.ShippingSlot)
                .Include(o => o.Shipping)!.ThenInclude(s => s.Branch)!.ThenInclude(b => b.Address)!.ThenInclude(a => a.City)
                .OrderBy(o => o.OrderCreationDate)
                .ThenBy(o => o.OrderId)
                .Select(o => new
                {
                    o.OrderId,
                    o.OrderCreationDate,
                    CustomerName = o.User != null ? ((o.User.FirstName ?? "") + " " + (o.User.LastName ?? "")).Trim() : "",
                    BranchName = (o.Shipping != null && o.Shipping.Branch != null && o.Shipping.Branch.Address != null && o.Shipping.Branch.Address.City != null)
                        ? o.Shipping.Branch.Address.City.CityName!
                        : "",
                    IsDelivery = o.Shipping != null ? o.Shipping.ShippingIsDelivery : null,
                    IsUrgent = o.Shipping != null ? o.Shipping.ShippingIsUrgent : null
                })
                .ToListAsync();

            var salesOrders = ordersList
                .Select(o => new SupplierSalesOrderRowDto
                {
                    OrderId = o.OrderId,
                    OrderCreationDate = o.OrderCreationDate,
                    CustomerName = o.CustomerName,
                    BranchName = o.BranchName,
                    IsDelivery = o.IsDelivery,
                    IsUrgent = o.IsUrgent,
                    SupplierLineRevenue = supplierRevenueMap.TryGetValue(o.OrderId, out var amt) ? amt : 0m
                })
                .ToList();

            // Supplier Orders (company purchases) for this supplier (SupplierOrderDate in range)
            var supplierOrdersQuery = _context.SupplierOrders
                .AsNoTracking()
                .Include(so => so.Supplier)
                .Include(so => so.Product)
                .Include(so => so.Branch)!.ThenInclude(b => b.Address)!.ThenInclude(a => a.City)
                .Where(so =>
                    so.SupplierId == supplierId &&
                    so.SupplierOrderDate.HasValue &&
                    so.SupplierOrderDate.Value >= fromDt &&
                    so.SupplierOrderDate.Value <= toDt);

            if (branchId.HasValue)
            {
                supplierOrdersQuery = supplierOrdersQuery.Where(so => so.BranchId == branchId.Value);
            }

            var supplierOrders = await supplierOrdersQuery
                .OrderBy(so => so.SupplierOrderDate)
                .ThenBy(so => so.SupplierOrderId)
                .Select(so => new SupplierOrderCostRowDto
                {
                    SupplierOrderId = so.SupplierOrderId,
                    SupplierOrderDate = so.SupplierOrderDate,
                    SupplierName = so.Supplier != null ? (so.Supplier.SupplierName ?? "") : "",
                    ProductName = so.Product != null ? (so.Product.ProductName ?? "") : "",
                    BranchName = (so.Branch != null && so.Branch.Address != null && so.Branch.Address.City != null)
                        ? (so.Branch.Address.City.CityName ?? "")
                        : "",
                    Quantity = so.SupplierOrderQuantity ?? 0,
                    UnitPrice = so.Product != null ? (so.Product.ProductPrice ?? 0m) : 0m,
                    TotalCost = (so.Product != null ? (so.Product.ProductPrice ?? 0m) : 0m) * (so.SupplierOrderQuantity ?? 0)
                })
                .ToListAsync();

            // Reorders for this supplier (NO date filter)
            var reordersQuery = _context.Reorders
                .AsNoTracking()
                .Include(r => r.Product)
                .Include(r => r.Supplier)
                .Include(r => r.Branch)!.ThenInclude(b => b.Address)!.ThenInclude(a => a.City)
                .Where(r => r.SupplierId == supplierId);

            if (branchId.HasValue)
            {
                reordersQuery = reordersQuery.Where(r => r.BranchId == branchId.Value);
            }

            var reorders = await reordersQuery
                .OrderBy(r => r.ReorderId)
                .Select(r => new ReorderCostRowDto
                {
                    ReorderId = r.ReorderId,
                    ProductName = r.Product != null ? (r.Product.ProductName ?? "") : "",
                    SupplierName = r.Supplier != null ? (r.Supplier.SupplierName ?? "") : "",
                    BranchName = (r.Branch != null && r.Branch.Address != null && r.Branch.Address.City != null)
                        ? (r.Branch.Address.City.CityName ?? "")
                        : "",
                    Threshold = r.ReorderThershold,
                    Quantity = r.ReorderQuantity ?? 0,
                    UnitPrice = r.Product != null ? (r.Product.ProductPrice ?? 0m) : 0m,
                    TotalCost = (r.Product != null ? (r.Product.ProductPrice ?? 0m) : 0m) * (r.ReorderQuantity ?? 0)
                })
                .ToListAsync();

            // Branch KPIs (same structure as TotalRevenue, but supplier-only)
            var branchScope = _context.Branches
                .AsNoTracking()
                .Include(b => b.Address)
                .ThenInclude(a => a.City)
                .AsQueryable();

            if (branchId.HasValue)
            {
                branchScope = branchScope.Where(b => b.BranchId == branchId.Value);
            }

            var branchList = await branchScope
                .OrderBy(b => b.BranchId)
                .Select(b => new
                {
                    b.BranchId,
                    BranchName =
                        b.Address != null && b.Address.City != null && b.Address.City.CityName != null
                            ? b.Address.City.CityName
                            : ("Branch " + b.BranchId)
                })
                .ToListAsync();

            var branchKpis = new List<BranchRevenueKpiDto>();

            foreach (var br in branchList)
            {
                var branchOrders = _context.Orders
                    .AsNoTracking()
                    .Include(o => o.Shipping)
                    .Include(o => o.Payment)
                    .Where(o => o.Shipping != null && o.Shipping.BranchId == br.BranchId);

                var brSuccessfulByPaymentTs = branchOrders.Where(o =>
                    o.Payment != null &&
                    o.Payment.PaymentIsSuccessful == true &&
                    o.Payment.PaymentTimestamp.HasValue &&
                    o.Payment.PaymentTimestamp.Value >= fromDt &&
                    o.Payment.PaymentTimestamp.Value <= toDt &&
                    supplierOrderIds.Contains(o.OrderId));

                var brSuccessfulLines =
                    from po in _context.ProductOrders.AsNoTracking()
                    join o in brSuccessfulByPaymentTs on po.OrderId equals o.OrderId
                    join p in _context.Products.AsNoTracking() on po.ProductId equals p.ProductId
                    where p.SupplierId == supplierId && p.ProductPrice.HasValue
                    select new { po.Quantity, Price = p.ProductPrice!.Value };

                var brSuccessfulRev = await brSuccessfulLines.SumAsync(x => x.Price * x.Quantity);
                var brSuccessfulCount = await brSuccessfulByPaymentTs.Select(o => o.OrderId).Distinct().CountAsync();

                var brUnsuccessfulByPaymentTs = branchOrders.Where(o =>
                    o.Payment != null &&
                    o.Payment.PaymentIsSuccessful == false &&
                    o.Payment.PaymentTimestamp.HasValue &&
                    o.Payment.PaymentTimestamp.Value >= fromDt &&
                    o.Payment.PaymentTimestamp.Value <= toDt &&
                    supplierOrderIds.Contains(o.OrderId));

                var brUnsuccessfulLines =
                    from po in _context.ProductOrders.AsNoTracking()
                    join o in brUnsuccessfulByPaymentTs on po.OrderId equals o.OrderId
                    join p in _context.Products.AsNoTracking() on po.ProductId equals p.ProductId
                    where p.SupplierId == supplierId && p.ProductPrice.HasValue
                    select new { po.Quantity, Price = p.ProductPrice!.Value };

                var brUnsuccessfulRev = await brUnsuccessfulLines.SumAsync(x => x.Price * x.Quantity);
                var brUnsuccessfulCount = await brUnsuccessfulByPaymentTs.Select(o => o.OrderId).Distinct().CountAsync();

                var brMissingPayment = await branchOrders
                    .Where(o =>
                        !o.PaymentId.HasValue &&
                        o.OrderCreationDate.HasValue &&
                        o.OrderCreationDate.Value >= fromDt &&
                        o.OrderCreationDate.Value <= toDt &&
                        supplierOrderIds.Contains(o.OrderId))
                    .Select(o => o.OrderId)
                    .Distinct()
                    .CountAsync();

                // Keep LineRevenueTotal aligned to supplier-only successful line revenue (same as total)
                branchKpis.Add(new BranchRevenueKpiDto
                {
                    BranchId = br.BranchId,
                    BranchName = br.BranchName,
                    Kpis = new TotalRevenueKpisDto
                    {
                        SuccessfulPaymentsTotal = brSuccessfulRev,
                        SuccessfulPaymentsCount = brSuccessfulCount,
                        UnsuccessfulPaymentsTotal = brUnsuccessfulRev,
                        UnsuccessfulPaymentsCount = brUnsuccessfulCount,
                        OrdersWithMissingPaymentCount = brMissingPayment,
                        LineRevenueTotal = brSuccessfulRev
                    }
                });
            }

            return new SupplierRevenueReportDto
            {
                SupplierId = supplierInfo.SupplierId,
                SupplierName = supplierInfo.SupplierName ?? $"Supplier {supplierInfo.SupplierId}",
                SupplierContact = supplierInfo.SupplierContact ?? "",
                SupplierEmail = supplierInfo.SupplierEmail ?? "",
                SupplierRepresentative = supplierInfo.SupplierRepresentative ?? "",
                ScopeLabel = scopeLabel,
                DateFrom = from,
                DateTo = to,
                Kpis = new TotalRevenueKpisDto
                {
                    SuccessfulPaymentsTotal = successfulRevenue,
                    SuccessfulPaymentsCount = successfulCount,
                    UnsuccessfulPaymentsTotal = unsuccessfulRevenue,
                    UnsuccessfulPaymentsCount = unsuccessfulCount,
                    OrdersWithMissingPaymentCount = missingPaymentCount,
                    LineRevenueTotal = successfulRevenue
                },
                BranchKpis = branchKpis,
                ProductSales = productSales,
                Orders = salesOrders,
                SupplierOrders = supplierOrders,
                Reorders = reorders
            };
        }

        public async Task<CategoryRevenueReportDto> BuildCategoryRevenueReportAsync(DateOnly from, DateOnly to, int categoryId, int? branchId)
        {
            var fromDt = from.ToDateTime(TimeOnly.MinValue);
            var toDt = to.ToDateTime(TimeOnly.MaxValue);

            var categoryInfo = await _context.Categories
                .AsNoTracking()
                .Where(c => c.CategoryId == categoryId)
                .Select(c => new { c.CategoryId, c.CategoryName })
                .FirstOrDefaultAsync();

            if (categoryInfo == null)
                throw new InvalidOperationException("CATEGORY_NOT_FOUND");

            var scopeLabel = "All branches";
            if (branchId.HasValue)
            {
                var cityName = await _context.Branches
                    .AsNoTracking()
                    .Where(b => b.BranchId == branchId.Value)
                    .Select(b => b.Address != null && b.Address.City != null ? b.Address.City.CityName : null)
                    .FirstOrDefaultAsync();

                scopeLabel = !string.IsNullOrWhiteSpace(cityName) ? cityName : $"Branch {branchId.Value}";
            }

            var orders = _context.Orders
                .AsNoTracking()
                .Include(o => o.Shipping)
                .Include(o => o.Payment)
                .AsQueryable();

            if (branchId.HasValue)
            {
                orders = orders.Where(o => o.Shipping != null && o.Shipping.BranchId == branchId.Value);
            }

            // Orders that contain at least one product from this category
            var categoryOrderIds = _context.ProductOrders
                .AsNoTracking()
                .Include(po => po.Product)
                .Where(po => po.OrderId.HasValue && po.Product != null && po.Product.CategoryId == categoryId)
                .Select(po => po.OrderId!.Value)
                .Distinct();

            // KPI: PaymentTimestamp based (successful/unsuccessful)
            var successfulOrdersByPaymentTs = orders.Where(o =>
                o.Payment != null &&
                o.Payment.PaymentIsSuccessful == true &&
                o.Payment.PaymentTimestamp.HasValue &&
                o.Payment.PaymentTimestamp.Value >= fromDt &&
                o.Payment.PaymentTimestamp.Value <= toDt &&
                categoryOrderIds.Contains(o.OrderId));

            var unsuccessfulOrdersByPaymentTs = orders.Where(o =>
                o.Payment != null &&
                o.Payment.PaymentIsSuccessful == false &&
                o.Payment.PaymentTimestamp.HasValue &&
                o.Payment.PaymentTimestamp.Value >= fromDt &&
                o.Payment.PaymentTimestamp.Value <= toDt &&
                categoryOrderIds.Contains(o.OrderId));

            var successfulCategoryLines =
                from po in _context.ProductOrders.AsNoTracking()
                join o in successfulOrdersByPaymentTs on po.OrderId equals o.OrderId
                join p in _context.Products.AsNoTracking() on po.ProductId equals p.ProductId
                where p.CategoryId == categoryId && p.ProductPrice.HasValue
                select new { po.OrderId, po.Quantity, Price = p.ProductPrice!.Value };

            var successfulRevenue = await successfulCategoryLines.SumAsync(x => x.Price * x.Quantity);
            var successfulCount = await successfulOrdersByPaymentTs.Select(o => o.OrderId).Distinct().CountAsync();

            var unsuccessfulCategoryLines =
                from po in _context.ProductOrders.AsNoTracking()
                join o in unsuccessfulOrdersByPaymentTs on po.OrderId equals o.OrderId
                join p in _context.Products.AsNoTracking() on po.ProductId equals p.ProductId
                where p.CategoryId == categoryId && p.ProductPrice.HasValue
                select new { po.OrderId, po.Quantity, Price = p.ProductPrice!.Value };

            var unsuccessfulRevenue = await unsuccessfulCategoryLines.SumAsync(x => x.Price * x.Quantity);
            var unsuccessfulCount = await unsuccessfulOrdersByPaymentTs.Select(o => o.OrderId).Distinct().CountAsync();

            // Missing payment count (OrderCreationDate based)
            var missingPaymentCount = await orders
                .Where(o =>
                    !o.PaymentId.HasValue &&
                    o.OrderCreationDate.HasValue &&
                    o.OrderCreationDate.Value >= fromDt &&
                    o.OrderCreationDate.Value <= toDt &&
                    categoryOrderIds.Contains(o.OrderId))
                .Select(o => o.OrderId)
                .Distinct()
                .CountAsync();

            // Lists: successful + in-range by OrderCreationDate
            var successfulOrdersByCreation = orders.Where(o =>
                o.Payment != null &&
                o.Payment.PaymentIsSuccessful == true &&
                o.OrderCreationDate.HasValue &&
                o.OrderCreationDate.Value >= fromDt &&
                o.OrderCreationDate.Value <= toDt &&
                categoryOrderIds.Contains(o.OrderId));

            var paidCategoryLines =
                from po in _context.ProductOrders.AsNoTracking()
                join o in successfulOrdersByCreation on po.OrderId equals o.OrderId
                join p in _context.Products.AsNoTracking() on po.ProductId equals p.ProductId
                where p.CategoryId == categoryId && p.ProductPrice.HasValue
                select new
                {
                    po.OrderId,
                    po.Quantity,
                    Price = p.ProductPrice!.Value,
                    p.ProductId,
                    p.ProductName,
                    p.ProductTypeId
                };

            // Revenue per order for "Category Sales Orders" section
            var revenueByOrder = await paidCategoryLines
                .GroupBy(x => x.OrderId!.Value)
                .Select(g => new { OrderId = g.Key, Amount = g.Sum(x => x.Price * x.Quantity) })
                .ToListAsync();

            var revenueMap = revenueByOrder.ToDictionary(x => x.OrderId, x => x.Amount);

            var ordersList = await _context.Orders
                .AsNoTracking()
                .Where(o => successfulOrdersByCreation.Select(x => x.OrderId).Contains(o.OrderId))
                .Include(o => o.User)
                .Include(o => o.Shipping)!.ThenInclude(s => s.ShippingSlot)
                .Include(o => o.Shipping)!.ThenInclude(s => s.Branch)!.ThenInclude(b => b.Address)!.ThenInclude(a => a.City)
                .OrderBy(o => o.OrderCreationDate)
                .ThenBy(o => o.OrderId)
                .Select(o => new
                {
                    o.OrderId,
                    o.OrderCreationDate,
                    CustomerName = o.User != null ? ((o.User.FirstName ?? "") + " " + (o.User.LastName ?? "")).Trim() : "",
                    BranchName = (o.Shipping != null && o.Shipping.Branch != null && o.Shipping.Branch.Address != null && o.Shipping.Branch.Address.City != null)
                        ? o.Shipping.Branch.Address.City.CityName!
                        : "",
                    IsDelivery = o.Shipping != null ? o.Shipping.ShippingIsDelivery : null,
                    IsUrgent = o.Shipping != null ? o.Shipping.ShippingIsUrgent : null
                })
                .ToListAsync();

            var salesOrders = ordersList
                .Select(o => new CategorySalesOrderRowDto
                {
                    OrderId = o.OrderId,
                    OrderCreationDate = o.OrderCreationDate,
                    CustomerName = o.CustomerName,
                    BranchName = o.BranchName,
                    IsDelivery = o.IsDelivery,
                    IsUrgent = o.IsUrgent,
                    CategoryLineRevenue = revenueMap.TryGetValue(o.OrderId, out var amt) ? amt : 0m
                })
                .ToList();

            // === Type -> Product breakdown ===
            var typeNames = await _context.ProductTypes
                .AsNoTracking()
                .Where(t => t.CategoryId == categoryId)
                .Select(t => new { t.ProductTypeId, t.ProductTypeName })
                .ToListAsync();

            var typeNameMap = typeNames.ToDictionary(x => x.ProductTypeId, x => x.ProductTypeName ?? "");

            var productsRaw = await paidCategoryLines
                .GroupBy(x => new { x.ProductTypeId, x.ProductId, x.ProductName })
                .Select(g => new
                {
                    g.Key.ProductTypeId,
                    g.Key.ProductId,
                    g.Key.ProductName,
                    OrdersCount = g.Select(x => x.OrderId!.Value).Distinct().Count(),
                    UnitsSold = g.Sum(x => x.Quantity),
                    Revenue = g.Sum(x => x.Price * x.Quantity)
                })
                .ToListAsync();

            var typeGroups = productsRaw
                .GroupBy(x => x.ProductTypeId)
                .Select(g => new CategoryTypeRevenueRowDto
                {
                    ProductTypeId = g.Key ?? 0,
                    ProductTypeName =
                        g.Key.HasValue && typeNameMap.TryGetValue(g.Key.Value, out var tn) && !string.IsNullOrWhiteSpace(tn)
                            ? tn
                            : (g.Key.HasValue ? $"Type {g.Key.Value}" : "—"),
                    OrdersCount = g.Select(x => x.ProductId).Any() ? g.SelectMany(_ => new[] { 0 }).Count() : 0, // replaced below
                    UnitsSold = g.Sum(x => x.UnitsSold),
                    Revenue = g.Sum(x => x.Revenue),
                    Products = g
                        .OrderByDescending(x => x.Revenue)
                        .ThenBy(x => x.ProductName)
                        .Select(x => new CategoryTypeProductRevenueRowDto
                        {
                            ProductId = x.ProductId,
                            ProductName = string.IsNullOrWhiteSpace(x.ProductName) ? $"Product {x.ProductId}" : x.ProductName,
                            OrdersCount = x.OrdersCount,
                            UnitsSold = x.UnitsSold,
                            Revenue = x.Revenue
                        })
                        .ToList()
                })
                .ToList();

            // Fix OrdersCount for each type (distinct orders across that type)
            var ordersCountByType = await paidCategoryLines
                .GroupBy(x => x.ProductTypeId)
                .Select(g => new { ProductTypeId = g.Key, OrdersCount = g.Select(x => x.OrderId!.Value).Distinct().Count() })
                .ToListAsync();

            var ordersCountByTypeMap = ordersCountByType.ToDictionary(x => x.ProductTypeId, x => x.OrdersCount);

            foreach (var t in typeGroups)
            {
                int? typeIdKey = t.ProductTypeId == 0 ? null : t.ProductTypeId;
                t.OrdersCount = ordersCountByTypeMap.TryGetValue(typeIdKey, out var cnt) ? cnt : 0;
            }

            // Branch KPIs (category-only) similar to supplier
            var branchScope = _context.Branches
                .AsNoTracking()
                .Include(b => b.Address)
                .ThenInclude(a => a.City)
                .AsQueryable();

            if (branchId.HasValue)
            {
                branchScope = branchScope.Where(b => b.BranchId == branchId.Value);
            }

            var branchList = await branchScope
                .OrderBy(b => b.BranchId)
                .Select(b => new
                {
                    b.BranchId,
                    BranchName =
                        b.Address != null && b.Address.City != null && b.Address.City.CityName != null
                            ? b.Address.City.CityName
                            : ("Branch " + b.BranchId)
                })
                .ToListAsync();

            var branchKpis = new List<BranchRevenueKpiDto>();

            foreach (var br in branchList)
            {
                var branchOrders = _context.Orders
                    .AsNoTracking()
                    .Include(o => o.Shipping)
                    .Include(o => o.Payment)
                    .Where(o => o.Shipping != null && o.Shipping.BranchId == br.BranchId);

                var brSuccessfulByPaymentTs = branchOrders.Where(o =>
                    o.Payment != null &&
                    o.Payment.PaymentIsSuccessful == true &&
                    o.Payment.PaymentTimestamp.HasValue &&
                    o.Payment.PaymentTimestamp.Value >= fromDt &&
                    o.Payment.PaymentTimestamp.Value <= toDt &&
                    categoryOrderIds.Contains(o.OrderId));

                var brSuccessfulLines =
                    from po in _context.ProductOrders.AsNoTracking()
                    join o in brSuccessfulByPaymentTs on po.OrderId equals o.OrderId
                    join p in _context.Products.AsNoTracking() on po.ProductId equals p.ProductId
                    where p.CategoryId == categoryId && p.ProductPrice.HasValue
                    select new { po.Quantity, Price = p.ProductPrice!.Value };

                var brSuccessfulRev = await brSuccessfulLines.SumAsync(x => x.Price * x.Quantity);
                var brSuccessfulCount = await brSuccessfulByPaymentTs.Select(o => o.OrderId).Distinct().CountAsync();

                var brUnsuccessfulByPaymentTs = branchOrders.Where(o =>
                    o.Payment != null &&
                    o.Payment.PaymentIsSuccessful == false &&
                    o.Payment.PaymentTimestamp.HasValue &&
                    o.Payment.PaymentTimestamp.Value >= fromDt &&
                    o.Payment.PaymentTimestamp.Value <= toDt &&
                    categoryOrderIds.Contains(o.OrderId));

                var brUnsuccessfulLines =
                    from po in _context.ProductOrders.AsNoTracking()
                    join o in brUnsuccessfulByPaymentTs on po.OrderId equals o.OrderId
                    join p in _context.Products.AsNoTracking() on po.ProductId equals p.ProductId
                    where p.CategoryId == categoryId && p.ProductPrice.HasValue
                    select new { po.Quantity, Price = p.ProductPrice!.Value };

                var brUnsuccessfulRev = await brUnsuccessfulLines.SumAsync(x => x.Price * x.Quantity);
                var brUnsuccessfulCount = await brUnsuccessfulByPaymentTs.Select(o => o.OrderId).Distinct().CountAsync();

                var brMissingPayment = await branchOrders
                    .Where(o =>
                        !o.PaymentId.HasValue &&
                        o.OrderCreationDate.HasValue &&
                        o.OrderCreationDate.Value >= fromDt &&
                        o.OrderCreationDate.Value <= toDt &&
                        categoryOrderIds.Contains(o.OrderId))
                    .Select(o => o.OrderId)
                    .Distinct()
                    .CountAsync();

                branchKpis.Add(new BranchRevenueKpiDto
                {
                    BranchId = br.BranchId,
                    BranchName = br.BranchName,
                    Kpis = new TotalRevenueKpisDto
                    {
                        SuccessfulPaymentsTotal = brSuccessfulRev,
                        SuccessfulPaymentsCount = brSuccessfulCount,
                        UnsuccessfulPaymentsTotal = brUnsuccessfulRev,
                        UnsuccessfulPaymentsCount = brUnsuccessfulCount,
                        OrdersWithMissingPaymentCount = brMissingPayment,
                        LineRevenueTotal = brSuccessfulRev
                    }
                });
            }

            return new CategoryRevenueReportDto
            {
                CategoryId = categoryInfo.CategoryId,
                CategoryName = string.IsNullOrWhiteSpace(categoryInfo.CategoryName) ? $"Category {categoryInfo.CategoryId}" : categoryInfo.CategoryName!,
                ScopeLabel = scopeLabel,
                DateFrom = from,
                DateTo = to,
                Kpis = new TotalRevenueKpisDto
                {
                    SuccessfulPaymentsTotal = successfulRevenue,
                    SuccessfulPaymentsCount = successfulCount,
                    UnsuccessfulPaymentsTotal = unsuccessfulRevenue,
                    UnsuccessfulPaymentsCount = unsuccessfulCount,
                    OrdersWithMissingPaymentCount = missingPaymentCount,
                    LineRevenueTotal = successfulRevenue
                },
                BranchKpis = branchKpis,
                TypeSales = typeGroups
                    .OrderByDescending(x => x.Revenue)
                    .ThenBy(x => x.ProductTypeName)
                    .ToList(),
                Orders = salesOrders
            };
        }




        public async Task<PagedResult<ReportListItemDto>> GetReportsAsync(
            int pageNumber,
            int pageSize,
            int? reportId = null,
            string? reportName = null,
            int? reportTypeId = null,
            DateOnly? creationDate = null)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 12;

            var reportsQuery = _context.Reports.AsQueryable();

            if (reportId.HasValue)
            {
                reportsQuery = reportsQuery.Where(r => r.ReportId == reportId.Value);
            }

            if (!string.IsNullOrWhiteSpace(reportName))
            {
                var term = reportName.Trim();

                if (!ValidNamePattern.IsMatch(term))
                {
                    return new PagedResult<ReportListItemDto>
                    {
                        Items = new List<ReportListItemDto>(),
                        TotalCount = 0
                    };
                }

                var lower = term.ToLower();
                reportsQuery = reportsQuery.Where(r => (r.ReportName ?? "").ToLower().StartsWith(lower));
            }

            if (reportTypeId.HasValue && reportTypeId.Value > 0)
            {
                reportsQuery = reportsQuery.Where(r => r.ReportTypeId == reportTypeId.Value);
            }

            if (creationDate.HasValue)
            {
                var from = creationDate.Value.ToDateTime(TimeOnly.MinValue);
                var to = creationDate.Value.ToDateTime(TimeOnly.MaxValue);

                reportsQuery = reportsQuery.Where(r => r.ReportCreationTimestamp >= from && r.ReportCreationTimestamp <= to);
            }

            var total = await reportsQuery.CountAsync();

            var itemsQuery =
                from r in reportsQuery
                join rt in _context.ReportTypes on r.ReportTypeId equals rt.ReportTypeId into rtj
                from rt in rtj.DefaultIfEmpty()
                orderby r.ReportCreationTimestamp descending, r.ReportId descending
                select new ReportListItemDto
                {
                    ReportId = r.ReportId,
                    ReportName = r.ReportName,
                    ReportTypeId = r.ReportTypeId,
                    ReportTypeName = rt != null ? rt.ReportTypeName : null,
                    ReportCreationTimestamp = r.ReportCreationTimestamp,
                    FileName = r.FileName,
                    ContentType = r.ContentType,
                    DocumentSizeBytes = r.DocumentSizeBytes
                };

            var items = await itemsQuery
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<ReportListItemDto>
            {
                Items = items,
                TotalCount = total
            };
        }

        public async Task<ProductRevenueReportDto> BuildProductRevenueReportAsync(DateOnly from, DateOnly to, int productId, int? branchId)
        {
            var fromDt = from.ToDateTime(TimeOnly.MinValue);
            var toDt = to.ToDateTime(TimeOnly.MaxValue);

            var productInfo = await _context.Products
                .AsNoTracking()
                .Where(p => p.ProductId == productId)
                .Select(p => new
                {
                    p.ProductId,
                    p.ProductName,
                    p.ProductDescription,
                    p.ProductPrice,
                    p.IsControlled,
                    p.SupplierId,
                    SupplierName = p.Supplier != null ? p.Supplier.SupplierName : null,
                    p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    p.ProductTypeId,
                    ProductTypeName = p.ProductType != null ? p.ProductType.ProductTypeName : null
                })
                .FirstOrDefaultAsync();

            if (productInfo == null)
                throw new InvalidOperationException("PRODUCT_NOT_FOUND");

            var scopeLabel = "All branches";
            if (branchId.HasValue)
            {
                var cityName = await _context.Branches
                    .AsNoTracking()
                    .Where(b => b.BranchId == branchId.Value)
                    .Select(b => b.Address != null && b.Address.City != null ? b.Address.City.CityName : null)
                    .FirstOrDefaultAsync();

                scopeLabel = !string.IsNullOrWhiteSpace(cityName) ? cityName : $"Branch {branchId.Value}";
            }

            // Ingredients (Ingredient_Product)
            var ingredients = await _context.IngredientProducts
                .AsNoTracking()
                .Where(ip => ip.ProductId == productId && ip.IngredientId.HasValue)
                .Include(ip => ip.Ingredient)
                .Select(ip => new
                {
                    IngredientId = ip.IngredientId!.Value,
                    IngredientName = ip.Ingredient != null ? ip.Ingredient.IngredientName : null
                })
                .Distinct()
                .OrderBy(x => x.IngredientName)
                .ToListAsync();

            var ingredientRows = ingredients
                .Select(x => new ProductIngredientRowDto
                {
                    IngredientId = x.IngredientId,
                    IngredientName = string.IsNullOrWhiteSpace(x.IngredientName) ? $"Ingredient {x.IngredientId}" : x.IngredientName!
                })
                .ToList();

            var ingredientIds = ingredientRows.Select(x => x.IngredientId).Distinct().ToList();

            // Interactions: any Interaction where both IngredientA and IngredientB are within this product's ingredient list
            // (matches your ProductDetails view pattern of interactions “for this product’s ingredients”)
            var interactionRows = new List<ProductInteractionRowDto>();
            if (ingredientIds.Count > 0)
            {
                interactionRows = await _context.Interactions
                    .AsNoTracking()
                    .Where(i =>
                        i.IngredientAId.HasValue &&
                        i.IngredientBId.HasValue &&
                        ingredientIds.Contains(i.IngredientAId.Value) &&
                        ingredientIds.Contains(i.IngredientBId.Value))
                    .Include(i => i.IngredientA)
                    .Include(i => i.IngredientB)
                    .Include(i => i.InteractionType)
                    .OrderBy(i => i.InteractionType != null ? i.InteractionType.InteractionTypeName : "")
                    .ThenBy(i => i.IngredientA != null ? i.IngredientA.IngredientName : "")
                    .ThenBy(i => i.IngredientB != null ? i.IngredientB.IngredientName : "")
                    .Select(i => new ProductInteractionRowDto
                    {
                        IngredientAName = i.IngredientA != null ? (i.IngredientA.IngredientName ?? "—") : "—",
                        IngredientBName = i.IngredientB != null ? (i.IngredientB.IngredientName ?? "—") : "—",
                        InteractionTypeName = i.InteractionType != null ? (i.InteractionType.InteractionTypeName ?? "—") : "—",
                        InteractionDescription = i.InteractionDescription
                    })
                    .ToListAsync();
            }

            var orders = _context.Orders
                .AsNoTracking()
                .Include(o => o.Shipping)
                .Include(o => o.Payment)
                .AsQueryable();

            if (branchId.HasValue)
            {
                orders = orders.Where(o => o.Shipping != null && o.Shipping.BranchId == branchId.Value);
            }

            // Orders that contain at least one line for this product
            var productOrderIds = _context.ProductOrders
                .AsNoTracking()
                .Where(po => po.OrderId.HasValue && po.ProductId == productId)
                .Select(po => po.OrderId!.Value)
                .Distinct();

            // KPI: PaymentTimestamp based totals
            var successfulOrdersByPaymentTs = orders.Where(o =>
                o.Payment != null &&
                o.Payment.PaymentIsSuccessful == true &&
                o.Payment.PaymentTimestamp.HasValue &&
                o.Payment.PaymentTimestamp.Value >= fromDt &&
                o.Payment.PaymentTimestamp.Value <= toDt &&
                productOrderIds.Contains(o.OrderId));

            var unsuccessfulOrdersByPaymentTs = orders.Where(o =>
                o.Payment != null &&
                o.Payment.PaymentIsSuccessful == false &&
                o.Payment.PaymentTimestamp.HasValue &&
                o.Payment.PaymentTimestamp.Value >= fromDt &&
                o.Payment.PaymentTimestamp.Value <= toDt &&
                productOrderIds.Contains(o.OrderId));

            var successfulProductLines =
                from po in _context.ProductOrders.AsNoTracking()
                join o in successfulOrdersByPaymentTs on po.OrderId equals o.OrderId
                join p in _context.Products.AsNoTracking() on po.ProductId equals p.ProductId
                where p.ProductId == productId && p.ProductPrice.HasValue
                select new { po.OrderId, po.Quantity, Price = p.ProductPrice!.Value };

            var successfulRevenue = await successfulProductLines.SumAsync(x => x.Price * x.Quantity);
            var successfulCount = await successfulOrdersByPaymentTs.Select(o => o.OrderId).Distinct().CountAsync();

            var unsuccessfulProductLines =
                from po in _context.ProductOrders.AsNoTracking()
                join o in unsuccessfulOrdersByPaymentTs on po.OrderId equals o.OrderId
                join p in _context.Products.AsNoTracking() on po.ProductId equals p.ProductId
                where p.ProductId == productId && p.ProductPrice.HasValue
                select new { po.OrderId, po.Quantity, Price = p.ProductPrice!.Value };

            var unsuccessfulRevenue = await unsuccessfulProductLines.SumAsync(x => x.Price * x.Quantity);
            var unsuccessfulCount = await unsuccessfulOrdersByPaymentTs.Select(o => o.OrderId).Distinct().CountAsync();

            var missingPaymentCount = await orders
                .Where(o =>
                    !o.PaymentId.HasValue &&
                    o.OrderCreationDate.HasValue &&
                    o.OrderCreationDate.Value >= fromDt &&
                    o.OrderCreationDate.Value <= toDt &&
                    productOrderIds.Contains(o.OrderId))
                .Select(o => o.OrderId)
                .Distinct()
                .CountAsync();

            // Lists: successful + OrderCreationDate range
            var successfulOrdersByCreation = orders.Where(o =>
                o.Payment != null &&
                o.Payment.PaymentIsSuccessful == true &&
                o.OrderCreationDate.HasValue &&
                o.OrderCreationDate.Value >= fromDt &&
                o.OrderCreationDate.Value <= toDt &&
                productOrderIds.Contains(o.OrderId));

            var paidProductLines =
                from po in _context.ProductOrders.AsNoTracking()
                join o in successfulOrdersByCreation on po.OrderId equals o.OrderId
                join p in _context.Products.AsNoTracking() on po.ProductId equals p.ProductId
                where p.ProductId == productId && p.ProductPrice.HasValue
                select new { po.OrderId, po.Quantity, Price = p.ProductPrice!.Value };

            var revenueByOrder = await paidProductLines
                .GroupBy(x => x.OrderId!.Value)
                .Select(g => new { OrderId = g.Key, UnitsSold = g.Sum(x => x.Quantity), Amount = g.Sum(x => x.Price * x.Quantity) })
                .ToListAsync();

            var revenueMap = revenueByOrder.ToDictionary(x => x.OrderId, x => x);

            var ordersList = await _context.Orders
                .AsNoTracking()
                .Where(o => successfulOrdersByCreation.Select(x => x.OrderId).Contains(o.OrderId))
                .Include(o => o.User)
                .Include(o => o.Shipping)!.ThenInclude(s => s.ShippingSlot)
                .Include(o => o.Shipping)!.ThenInclude(s => s.Branch)!.ThenInclude(b => b.Address)!.ThenInclude(a => a.City)
                .OrderBy(o => o.OrderCreationDate)
                .ThenBy(o => o.OrderId)
                .Select(o => new
                {
                    o.OrderId,
                    o.OrderCreationDate,
                    CustomerName = o.User != null ? ((o.User.FirstName ?? "") + " " + (o.User.LastName ?? "")).Trim() : "",
                    BranchName = (o.Shipping != null && o.Shipping.Branch != null && o.Shipping.Branch.Address != null && o.Shipping.Branch.Address.City != null)
                        ? o.Shipping.Branch.Address.City.CityName!
                        : "",
                    IsDelivery = o.Shipping != null ? o.Shipping.ShippingIsDelivery : null,
                    IsUrgent = o.Shipping != null ? o.Shipping.ShippingIsUrgent : null
                })
                .ToListAsync();

            var salesOrders = ordersList
                .Select(o =>
                {
                    var line = revenueMap.TryGetValue(o.OrderId, out var v) ? v : null;

                    return new ProductSalesOrderRowDto
                    {
                        OrderId = o.OrderId,
                        OrderCreationDate = o.OrderCreationDate,
                        CustomerName = o.CustomerName,
                        BranchName = o.BranchName,
                        IsDelivery = o.IsDelivery,
                        IsUrgent = o.IsUrgent,
                        UnitsSold = line?.UnitsSold ?? 0,
                        ProductLineRevenue = line?.Amount ?? 0m
                    };
                })
                .ToList();

            // Supplier Orders for this product (SupplierOrderDate in range)
            var supplierOrdersQuery = _context.SupplierOrders
                .AsNoTracking()
                .Include(so => so.Supplier)
                .Include(so => so.Product)
                .Include(so => so.Branch)!.ThenInclude(b => b.Address)!.ThenInclude(a => a.City)
                .Where(so =>
                    so.ProductId == productId &&
                    so.SupplierOrderDate.HasValue &&
                    so.SupplierOrderDate.Value >= fromDt &&
                    so.SupplierOrderDate.Value <= toDt);

            if (branchId.HasValue)
            {
                supplierOrdersQuery = supplierOrdersQuery.Where(so => so.BranchId == branchId.Value);
            }

            var supplierOrders = await supplierOrdersQuery
                .OrderBy(so => so.SupplierOrderDate)
                .ThenBy(so => so.SupplierOrderId)
                .Select(so => new SupplierOrderCostRowDto
                {
                    SupplierOrderId = so.SupplierOrderId,
                    SupplierOrderDate = so.SupplierOrderDate,
                    SupplierName = so.Supplier != null ? (so.Supplier.SupplierName ?? "") : "",
                    ProductName = so.Product != null ? (so.Product.ProductName ?? "") : "",
                    BranchName = (so.Branch != null && so.Branch.Address != null && so.Branch.Address.City != null)
                        ? (so.Branch.Address.City.CityName ?? "")
                        : "",
                    Quantity = so.SupplierOrderQuantity ?? 0,
                    UnitPrice = so.Product != null ? (so.Product.ProductPrice ?? 0m) : 0m,
                    TotalCost = (so.Product != null ? (so.Product.ProductPrice ?? 0m) : 0m) * (so.SupplierOrderQuantity ?? 0)
                })
                .ToListAsync();

            // Reorders for this product (NO date filter)
            var reordersQuery = _context.Reorders
                .AsNoTracking()
                .Include(r => r.Product)
                .Include(r => r.Supplier)
                .Include(r => r.Branch)!.ThenInclude(b => b.Address)!.ThenInclude(a => a.City)
                .Where(r => r.ProductId == productId);

            if (branchId.HasValue)
            {
                reordersQuery = reordersQuery.Where(r => r.BranchId == branchId.Value);
            }

            var reorders = await reordersQuery
                .OrderBy(r => r.ReorderId)
                .Select(r => new ReorderCostRowDto
                {
                    ReorderId = r.ReorderId,
                    ProductName = r.Product != null ? (r.Product.ProductName ?? "") : "",
                    SupplierName = r.Supplier != null ? (r.Supplier.SupplierName ?? "") : "",
                    BranchName = (r.Branch != null && r.Branch.Address != null && r.Branch.Address.City != null)
                        ? (r.Branch.Address.City.CityName ?? "")
                        : "",
                    Threshold = r.ReorderThershold,
                    Quantity = r.ReorderQuantity ?? 0,
                    UnitPrice = r.Product != null ? (r.Product.ProductPrice ?? 0m) : 0m,
                    TotalCost = (r.Product != null ? (r.Product.ProductPrice ?? 0m) : 0m) * (r.ReorderQuantity ?? 0)
                })
                .ToListAsync();

            // Branch KPI blocks (product-only)
            var branchScope = _context.Branches
                .AsNoTracking()
                .Include(b => b.Address)
                .ThenInclude(a => a.City)
                .AsQueryable();

            if (branchId.HasValue)
            {
                branchScope = branchScope.Where(b => b.BranchId == branchId.Value);
            }

            var branchList = await branchScope
                .OrderBy(b => b.BranchId)
                .Select(b => new
                {
                    b.BranchId,
                    BranchName =
                        b.Address != null && b.Address.City != null && b.Address.City.CityName != null
                            ? b.Address.City.CityName
                            : ("Branch " + b.BranchId)
                })
                .ToListAsync();

            var branchKpis = new List<BranchRevenueKpiDto>();

            foreach (var br in branchList)
            {
                var branchOrders = _context.Orders
                    .AsNoTracking()
                    .Include(o => o.Shipping)
                    .Include(o => o.Payment)
                    .Where(o => o.Shipping != null && o.Shipping.BranchId == br.BranchId);

                var brSuccessfulByPaymentTs = branchOrders.Where(o =>
                    o.Payment != null &&
                    o.Payment.PaymentIsSuccessful == true &&
                    o.Payment.PaymentTimestamp.HasValue &&
                    o.Payment.PaymentTimestamp.Value >= fromDt &&
                    o.Payment.PaymentTimestamp.Value <= toDt &&
                    productOrderIds.Contains(o.OrderId));

                var brSuccessfulLines =
                    from po in _context.ProductOrders.AsNoTracking()
                    join o in brSuccessfulByPaymentTs on po.OrderId equals o.OrderId
                    join p in _context.Products.AsNoTracking() on po.ProductId equals p.ProductId
                    where p.ProductId == productId && p.ProductPrice.HasValue
                    select new { po.Quantity, Price = p.ProductPrice!.Value };

                var brSuccessfulRev = await brSuccessfulLines.SumAsync(x => x.Price * x.Quantity);
                var brSuccessfulCount = await brSuccessfulByPaymentTs.Select(o => o.OrderId).Distinct().CountAsync();

                var brUnsuccessfulByPaymentTs = branchOrders.Where(o =>
                    o.Payment != null &&
                    o.Payment.PaymentIsSuccessful == false &&
                    o.Payment.PaymentTimestamp.HasValue &&
                    o.Payment.PaymentTimestamp.Value >= fromDt &&
                    o.Payment.PaymentTimestamp.Value <= toDt &&
                    productOrderIds.Contains(o.OrderId));

                var brUnsuccessfulLines =
                    from po in _context.ProductOrders.AsNoTracking()
                    join o in brUnsuccessfulByPaymentTs on po.OrderId equals o.OrderId
                    join p in _context.Products.AsNoTracking() on po.ProductId equals p.ProductId
                    where p.ProductId == productId && p.ProductPrice.HasValue
                    select new { po.Quantity, Price = p.ProductPrice!.Value };

                var brUnsuccessfulRev = await brUnsuccessfulLines.SumAsync(x => x.Price * x.Quantity);
                var brUnsuccessfulCount = await brUnsuccessfulByPaymentTs.Select(o => o.OrderId).Distinct().CountAsync();

                var brMissingPayment = await branchOrders
                    .Where(o =>
                        !o.PaymentId.HasValue &&
                        o.OrderCreationDate.HasValue &&
                        o.OrderCreationDate.Value >= fromDt &&
                        o.OrderCreationDate.Value <= toDt &&
                        productOrderIds.Contains(o.OrderId))
                    .Select(o => o.OrderId)
                    .Distinct()
                    .CountAsync();

                branchKpis.Add(new BranchRevenueKpiDto
                {
                    BranchId = br.BranchId,
                    BranchName = br.BranchName,
                    Kpis = new TotalRevenueKpisDto
                    {
                        SuccessfulPaymentsTotal = brSuccessfulRev,
                        SuccessfulPaymentsCount = brSuccessfulCount,
                        UnsuccessfulPaymentsTotal = brUnsuccessfulRev,
                        UnsuccessfulPaymentsCount = brUnsuccessfulCount,
                        OrdersWithMissingPaymentCount = brMissingPayment,
                        LineRevenueTotal = brSuccessfulRev
                    }
                });
            }

            return new ProductRevenueReportDto
            {
                ProductId = productInfo.ProductId,
                ProductName = string.IsNullOrWhiteSpace(productInfo.ProductName) ? $"Product {productInfo.ProductId}" : productInfo.ProductName!,
                ProductDescription = productInfo.ProductDescription,
                ProductPrice = productInfo.ProductPrice,
                IsControlled = productInfo.IsControlled,

                SupplierId = productInfo.SupplierId,
                SupplierName = productInfo.SupplierName,

                CategoryId = productInfo.CategoryId,
                CategoryName = productInfo.CategoryName,

                ProductTypeId = productInfo.ProductTypeId,
                ProductTypeName = productInfo.ProductTypeName,

                ScopeLabel = scopeLabel,
                DateFrom = from,
                DateTo = to,

                Ingredients = ingredientRows,
                KnownInteractions = interactionRows,

                Kpis = new TotalRevenueKpisDto
                {
                    SuccessfulPaymentsTotal = successfulRevenue,
                    SuccessfulPaymentsCount = successfulCount,
                    UnsuccessfulPaymentsTotal = unsuccessfulRevenue,
                    UnsuccessfulPaymentsCount = unsuccessfulCount,
                    OrdersWithMissingPaymentCount = missingPaymentCount,
                    LineRevenueTotal = successfulRevenue
                },
                BranchKpis = branchKpis,

                SupplierOrders = supplierOrders,
                Reorders = reorders,
                Orders = salesOrders
            };
        }


        public async Task<ComplianceReportDto> BuildComplianceReportAsync(DateOnly from, DateOnly to, int? branchId)
        {
            var fromDt = from.ToDateTime(TimeOnly.MinValue);
            var toDt = to.ToDateTime(TimeOnly.MaxValue);

            var scopeLabel = "All branches";
            if (branchId.HasValue)
            {
                var cityName = await _context.Branches
                    .AsNoTracking()
                    .Where(b => b.BranchId == branchId.Value)
                    .Select(b => b.Address != null && b.Address.City != null ? b.Address.City.CityName : null)
                    .FirstOrDefaultAsync();

                scopeLabel = !string.IsNullOrWhiteSpace(cityName) ? cityName : $"Branch {branchId.Value}";
            }

            var branchesQuery = _context.Branches
                .AsNoTracking()
                .Include(b => b.Address)!.ThenInclude(a => a.City)
                .AsQueryable();

            if (branchId.HasValue)
            {
                branchesQuery = branchesQuery.Where(b => b.BranchId == branchId.Value);
            }

            var branches = await branchesQuery
                .OrderBy(b => b.BranchId)
                .Select(b => new
                {
                    b.BranchId,
                    BranchName =
                        b.Address != null && b.Address.City != null && b.Address.City.CityName != null
                            ? b.Address.City.CityName
                            : ("Branch " + b.BranchId)
                })
                .ToListAsync();

            var branchIds = branches.Select(b => b.BranchId).ToList();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var daysBeforeExpiry = 29;
            var nearExpiryCutoff = today.AddDays(daysBeforeExpiry);

            // -------- Inventory base (by selected branches) --------
            var inventoryRows = await _context.Inventories
                .AsNoTracking()
                .Where(i => i.BranchId.HasValue && branchIds.Contains(i.BranchId.Value))
                .Include(i => i.Product)!.ThenInclude(p => p.Supplier)
                .Include(i => i.Product)!.ThenInclude(p => p.Category)
                .Include(i => i.Product)!.ThenInclude(p => p.ProductType)
                .Include(i => i.Branch)!.ThenInclude(b => b.Address)!.ThenInclude(a => a.City)
                .Select(i => new ComplianceInventoryRowDto
                {
                    InventoryId = i.InventoryId,
                    BranchId = i.BranchId ?? 0,
                    BranchName = i.Branch != null && i.Branch.Address != null && i.Branch.Address.City != null ? (i.Branch.Address.City.CityName ?? "") : "",
                    ProductId = i.ProductId ?? 0,
                    ProductName = i.Product != null ? (i.Product.ProductName ?? "") : "",
                    SupplierName = i.Product != null && i.Product.Supplier != null ? (i.Product.Supplier.SupplierName ?? "") : "",
                    CategoryName = i.Product != null && i.Product.Category != null ? (i.Product.Category.CategoryName ?? "") : "",
                    ProductTypeName = i.Product != null && i.Product.ProductType != null ? (i.Product.ProductType.ProductTypeName ?? "") : "",
                    IsControlled = i.Product != null && i.Product.IsControlled == true,
                    Quantity = i.InventoryQuantity ?? 0,
                    ExpiryDate = i.InventoryExpiryDate
                })
                .ToListAsync();

            // Near expiry + expired from the same inventory list:
            var nearExpiry = inventoryRows
                .Where(x => x.ExpiryDate.HasValue && x.ExpiryDate.Value >= today && x.ExpiryDate.Value <= nearExpiryCutoff)
                .Select(x => new ComplianceExpiredInventoryRowDto
                {
                    InventoryId = x.InventoryId,
                    BranchId = x.BranchId,
                    BranchName = x.BranchName,
                    ProductId = x.ProductId,
                    ProductName = x.ProductName,
                    Quantity = x.Quantity,
                    ExpiryDate = x.ExpiryDate,
                    SupplierName = x.SupplierName,
                    CategoryName = x.CategoryName,
                    ProductTypeName = x.ProductTypeName
                })
                .OrderBy(x => x.BranchName)
                .ThenBy(x => x.ExpiryDate)
                .ThenBy(x => x.ProductName)
                .ToList();

            var expired = inventoryRows
                .Where(x => x.ExpiryDate.HasValue && x.ExpiryDate.Value < today)
                .Select(x => new ComplianceExpiredInventoryRowDto
                {
                    InventoryId = x.InventoryId,
                    BranchId = x.BranchId,
                    BranchName = x.BranchName,
                    ProductId = x.ProductId,
                    ProductName = x.ProductName,
                    Quantity = x.Quantity,
                    ExpiryDate = x.ExpiryDate,
                    SupplierName = x.SupplierName,
                    CategoryName = x.CategoryName,
                    ProductTypeName = x.ProductTypeName
                })
                .OrderBy(x => x.BranchName)
                .ThenBy(x => x.ExpiryDate)
                .ThenBy(x => x.ProductName)
                .ToList();

            // -------- Orders (use TotalRevenue pattern; by selected branches) --------
            var successfulOrdersByCreation = _context.Orders
                .AsNoTracking()
                .Include(o => o.Shipping)
                .Include(o => o.Payment)
                .Where(o =>
                    o.Payment != null &&
                    o.Payment.PaymentIsSuccessful == true &&
                    o.OrderCreationDate.HasValue &&
                    o.OrderCreationDate.Value >= fromDt &&
                    o.OrderCreationDate.Value <= toDt &&
                    o.Shipping != null &&
                    o.Shipping.BranchId.HasValue &&
                    branchIds.Contains(o.Shipping.BranchId.Value));

            var ordersList = await _context.Orders
                .AsNoTracking()
                .Where(o => successfulOrdersByCreation.Select(x => x.OrderId).Contains(o.OrderId))
                .Include(o => o.User)
                .Include(o => o.Payment)
                .Include(o => o.Shipping)!.ThenInclude(s => s.ShippingSlot)
                .Include(o => o.Shipping)!.ThenInclude(s => s.Branch)!.ThenInclude(b => b.Address)!.ThenInclude(a => a.City)
                .OrderBy(o => o.OrderCreationDate)
                .ThenBy(o => o.OrderId)
                .Select(o => new OrderListRowDto
                {
                    OrderId = o.OrderId,
                    OrderCreationDate = o.OrderCreationDate,
                    CustomerUserId = o.UserId,
                    CustomerName = o.User != null ? ((o.User.FirstName ?? "") + " " + (o.User.LastName ?? "")).Trim() : "",
                    PaymentIsSuccessful = o.Payment != null ? o.Payment.PaymentIsSuccessful : null,
                    OrderTotal = o.OrderTotal,
                    IsDelivery = o.Shipping != null ? o.Shipping.ShippingIsDelivery : null,
                    IsUrgent = o.Shipping != null ? o.Shipping.ShippingIsUrgent : null,
                    ShippingDate = o.Shipping != null ? o.Shipping.ShippingDate : null,
                    SlotName = (o.Shipping != null && o.Shipping.ShippingSlot != null) ? o.Shipping.ShippingSlot.SlotName : "",
                    BranchName = (o.Shipping != null && o.Shipping.Branch != null && o.Shipping.Branch.Address != null && o.Shipping.Branch.Address.City != null)
                        ? o.Shipping.Branch.Address.City.CityName!
                        : ""
                })
                .ToListAsync();

            var deliveryRequests = await _context.Orders
                .AsNoTracking()
                .Where(o =>
                    o.Payment != null &&
                    o.Payment.PaymentIsSuccessful == true &&
                    o.OrderCreationDate.HasValue &&
                    o.OrderCreationDate.Value >= fromDt &&
                    o.OrderCreationDate.Value <= toDt &&
                    o.Shipping != null &&
                    o.Shipping.ShippingIsDelivery == true &&
                    o.Shipping.BranchId.HasValue &&
                    branchIds.Contains(o.Shipping.BranchId.Value))
                .Include(o => o.User)
                .Include(o => o.Payment)!.ThenInclude(p => p.PaymentMethod)
                .Include(o => o.Shipping)!.ThenInclude(s => s.ShippingSlot)
                .Include(o => o.Shipping)!.ThenInclude(s => s.Address)!.ThenInclude(a => a.City)
                .OrderBy(o => o.OrderCreationDate)
                .ThenBy(o => o.OrderId)
                .Select(o => new DeliveryRequestRowDto
                {
                    OrderId = o.OrderId,
                    ShippingId = o.Shipping!.ShippingId,
                    CustomerName = o.User != null ? ((o.User.FirstName ?? "") + " " + (o.User.LastName ?? "")).Trim() : "",
                    CustomerPhone = o.User != null ? (o.User.ContactNumber ?? "") : "",
                    CustomerEmail = o.User != null ? (o.User.EmailAddress ?? "") : "",
                    Location =
                        (o.Shipping!.Address != null
                            ? $"{o.Shipping.Address.Block}, {o.Shipping.Address.Street}, {o.Shipping.Address.BuildingNumber}"
                            : ""),
                    IsUrgent = o.Shipping.ShippingIsUrgent == true,
                    SlotName = o.Shipping.ShippingSlot != null ? o.Shipping.ShippingSlot.SlotName : "",
                    OrderStatusName = o.OrderStatus != null ? (o.OrderStatus.OrderStatusName ?? "") : "",
                    PaymentMethod = (o.Payment != null && o.Payment.PaymentMethod != null) ? (o.Payment.PaymentMethod.PaymentMethodName ?? "") : "",
                    IsPaymentSuccessful = o.Payment != null && o.Payment.PaymentIsSuccessful == true
                })
                .ToListAsync();

            // -------- Supplier Orders / Reorders --------
            var supplierOrders = await _context.SupplierOrders
      .AsNoTracking()
      .Include(so => so.Supplier)
      .Include(so => so.Product)
      .Include(so => so.Branch)!.ThenInclude(b => b.Address)!.ThenInclude(a => a.City)
      .Where(so =>
          so.BranchId != 0 &&
          branchIds.Contains(so.BranchId) &&
          so.SupplierOrderDate.HasValue &&
          so.SupplierOrderDate.Value >= fromDt &&
          so.SupplierOrderDate.Value <= toDt)
      .OrderBy(so => so.SupplierOrderDate)
      .ThenBy(so => so.SupplierOrderId)
      .Select(so => new SupplierOrderCostRowDto
      {
          SupplierOrderId = so.SupplierOrderId,
          SupplierOrderDate = so.SupplierOrderDate,
          SupplierName = so.Supplier != null ? (so.Supplier.SupplierName ?? "") : "",
          ProductName = so.Product != null ? (so.Product.ProductName ?? "") : "",
          BranchName = (so.Branch != null && so.Branch.Address != null && so.Branch.Address.City != null)
              ? (so.Branch.Address.City.CityName ?? "")
              : "",
          Quantity = so.SupplierOrderQuantity ?? 0,
          UnitPrice = so.Product != null ? (so.Product.ProductPrice ?? 0m) : 0m,
          TotalCost = (so.Product != null ? (so.Product.ProductPrice ?? 0m) : 0m) * (so.SupplierOrderQuantity ?? 0)
      })
      .ToListAsync();

            var reorders = await _context.Reorders
                .AsNoTracking()
                .Include(r => r.Product)
                .Include(r => r.Supplier)
                .Include(r => r.Branch)!.ThenInclude(b => b.Address)!.ThenInclude(a => a.City)
                .Where(r => r.BranchId != 0 && branchIds.Contains(r.BranchId))
                .OrderBy(r => r.ReorderId)
                .Select(r => new ReorderCostRowDto
                {
                    ReorderId = r.ReorderId,
                    ProductName = r.Product != null ? (r.Product.ProductName ?? "") : "",
                    SupplierName = r.Supplier != null ? (r.Supplier.SupplierName ?? "") : "",
                    BranchName = (r.Branch != null && r.Branch.Address != null && r.Branch.Address.City != null)
                        ? (r.Branch.Address.City.CityName ?? "")
                        : "",
                    Threshold = r.ReorderThershold,
                    Quantity = r.ReorderQuantity ?? 0,
                    UnitPrice = r.Product != null ? (r.Product.ProductPrice ?? 0m) : 0m,
                    TotalCost = (r.Product != null ? (r.Product.ProductPrice ?? 0m) : 0m) * (r.ReorderQuantity ?? 0)
                })
                .ToListAsync();

            // -------- Prescriptions + approvals (branch from Prescription.Address.City.BranchId) --------
            var prescriptionsRaw = await _context.Prescriptions
                .AsNoTracking()
                .Include(p => p.User)
                .Include(p => p.PrescriptionStatus)
                .Include(p => p.Address)!.ThenInclude(a => a.City)
                .Where(p =>
                    p.PrescriptionCreationDate.HasValue &&
                    p.PrescriptionCreationDate.Value >= from &&
                    p.PrescriptionCreationDate.Value <= to &&
                    p.Address != null &&
                    p.Address.City != null &&
                    p.Address.City.BranchId.HasValue &&
                    branchIds.Contains(p.Address.City.BranchId.Value))
                .OrderByDescending(p => p.PrescriptionCreationDate)
                .Select(p => new
                {
                    p.PrescriptionId,
                    p.PrescriptionName,
                    p.PrescriptionCreationDate,
                    StatusName = p.PrescriptionStatus != null ? p.PrescriptionStatus.PrescriptionStatusName : null,
                    CustomerName = p.User != null ? ((p.User.FirstName ?? "") + " " + (p.User.LastName ?? "")).Trim() : "",
                    BranchId = p.Address!.City!.BranchId!.Value,
                    BranchName = p.Address.City.CityName ?? ""
                })
                .ToListAsync();

            var prescriptionRows = prescriptionsRaw
                .Select(x => new CompliancePrescriptionRowDto
                {
                    PrescriptionId = x.PrescriptionId,
                    PrescriptionName = string.IsNullOrWhiteSpace(x.PrescriptionName) ? $"Prescription #{x.PrescriptionId}" : x.PrescriptionName!,
                    CreationDate = x.PrescriptionCreationDate,
                    StatusName = string.IsNullOrWhiteSpace(x.StatusName) ? "—" : x.StatusName!,
                    CustomerName = string.IsNullOrWhiteSpace(x.CustomerName) ? "—" : x.CustomerName,
                    BranchId = x.BranchId,
                    BranchName = string.IsNullOrWhiteSpace(x.BranchName) ? $"Branch {x.BranchId}" : x.BranchName
                })
                .ToList();

            var approvalsRaw = await _context.Approvals
                .AsNoTracking()
                .Include(a => a.User)
                .Include(a => a.Prescription)!.ThenInclude(p => p.Address)!.ThenInclude(ad => ad.City)
                .Where(a =>
                    a.ApprovalDate.HasValue &&
                    a.ApprovalDate.Value >= from &&
                    a.ApprovalDate.Value <= to &&
                    a.Prescription != null &&
                    a.Prescription.Address != null &&
                    a.Prescription.Address.City != null &&
                    a.Prescription.Address.City.BranchId.HasValue &&
                    branchIds.Contains(a.Prescription.Address.City.BranchId.Value))
                .Select(a => new
                {
                    a.ApprovalId,
                    a.ApprovalDate,
                    a.ApprovalTimestamp,
                    a.ApprovalProductName,
                    a.ApprovalQuantity,
                    a.ApprovalPrescriptionExpiryDate,
                    PrescriptionId = a.PrescriptionId ?? 0,
                    PrescriptionName = a.Prescription != null ? a.Prescription.PrescriptionName : null,
                    EmployeeId = a.UserId ?? 0,
                    EmployeeName = a.User != null ? ((a.User.FirstName ?? "") + " " + (a.User.LastName ?? "")).Trim() : "",
                    BranchId = a.Prescription!.Address!.City!.BranchId!.Value,
                    BranchName = a.Prescription.Address.City.CityName ?? ""
                })
                .ToListAsync();

            // Controlled check by product name (because Approval stores name, not productId)
            // This matches your checkout validation normalization strategy.
            static string Normalize(string? s)
            {
                if (string.IsNullOrWhiteSpace(s)) return "";
                return string.Join(" ",
                    s.Trim().ToLowerInvariant()
                     .Split(' ', StringSplitOptions.RemoveEmptyEntries));
            }

            var approvedProductNames = approvalsRaw
                .Select(x => Normalize(x.ApprovalProductName))
                .Where(x => x.Length > 0)
                .Distinct()
                .ToList();

            var controlledProductNameSet = await _context.Products
                .AsNoTracking()
                .Where(p => p.IsControlled == true && p.ProductName != null)
                .Select(p => p.ProductName!)
                .ToListAsync();

            var controlledNormalized = controlledProductNameSet.Select(Normalize).Where(x => x.Length > 0).ToHashSet();

            var approvalRows = approvalsRaw
                .Select(x => new ComplianceApprovalRowDto
                {
                    ApprovalId = x.ApprovalId,
                    ApprovalDate = x.ApprovalDate,
                    ApprovalTimestamp = x.ApprovalTimestamp,
                    PrescriptionId = x.PrescriptionId,
                    PrescriptionName = string.IsNullOrWhiteSpace(x.PrescriptionName) ? $"Prescription #{x.PrescriptionId}" : x.PrescriptionName!,
                    EmployeeUserId = x.EmployeeId,
                    EmployeeName = string.IsNullOrWhiteSpace(x.EmployeeName) ? "—" : x.EmployeeName,
                    ProductName = string.IsNullOrWhiteSpace(x.ApprovalProductName) ? "—" : x.ApprovalProductName!,
                    Quantity = x.ApprovalQuantity ?? 0,
                    PrescriptionExpiryDate = x.ApprovalPrescriptionExpiryDate,
                    BranchId = x.BranchId,
                    BranchName = string.IsNullOrWhiteSpace(x.BranchName) ? $"Branch {x.BranchId}" : x.BranchName,
                    IsControlled = controlledNormalized.Contains(Normalize(x.ApprovalProductName))
                })
                .OrderBy(x => x.BranchName)
                .ThenByDescending(x => x.ApprovalTimestamp ?? DateTime.MinValue)
                .ToList();

            // -------- Logs summary (no raw descriptions) --------
            var importantLogTypeIds = new[] { 1, 2, 3, 4, 5, 6, 7, 10 };

            var logs = await _context.Logs
                .AsNoTracking()
                .Include(l => l.LogType)
                .Include(l => l.User)
                .Where(l =>
                    l.LogTimestamp.HasValue &&
                    l.LogTimestamp.Value >= fromDt &&
                    l.LogTimestamp.Value <= toDt &&
                    l.LogTypeId.HasValue &&
                    importantLogTypeIds.Contains(l.LogTypeId.Value))
                .Select(l => new
                {
                    LogTypeId = l.LogTypeId!.Value,
                    LogTypeName = l.LogType != null ? l.LogType.LogTypeName : "",
                    UserId = l.UserId ?? 0,
                    EmployeeName = l.User != null ? ((l.User.FirstName ?? "") + " " + (l.User.LastName ?? "")).Trim() : "System"
                })
                .ToListAsync();

            // Now build per-branch sections
            var result = new ComplianceReportDto
            {
                ScopeLabel = scopeLabel,
                DateFrom = from,
                DateTo = to,
                DaysBeforeExpiryThreshold = daysBeforeExpiry
            };

            foreach (var br in branches)
            {
                var invForBranch = inventoryRows.Where(x => x.BranchId == br.BranchId).ToList();

                var totalQty = invForBranch.Sum(x => x.Quantity);

                var top = invForBranch.OrderByDescending(x => x.Quantity).FirstOrDefault();
                var low = invForBranch.Where(x => x.Quantity > 0).OrderBy(x => x.Quantity).FirstOrDefault();

                var invInsights = new ComplianceInventoryInsightsDto
                {
                    TotalQuantity = totalQty,
                    TopStockProductName = top?.ProductName,
                    TopStockQuantity = top?.Quantity ?? 0,
                    LowStockProductName = low?.ProductName,
                    LowStockQuantity = low?.Quantity ?? 0
                };

                var ordersForBranch = ordersList.Where(o => string.Equals(o.BranchName, br.BranchName, StringComparison.OrdinalIgnoreCase)).ToList();
                var deliveryForBranch = deliveryRequests.Where(d => d.Location != null) // delivery rows don't carry branch name; match via order list if needed later
                    .ToList();

                var supplierOrdersForBranch = supplierOrders.Where(x => string.Equals(x.BranchName, br.BranchName, StringComparison.OrdinalIgnoreCase)).ToList();
                var reordersForBranch = reorders.Where(x => string.Equals(x.BranchName, br.BranchName, StringComparison.OrdinalIgnoreCase)).ToList();

                var presForBranch = prescriptionRows.Where(x => x.BranchId == br.BranchId).ToList();
                var apprForBranch = approvalRows.Where(x => x.BranchId == br.BranchId).ToList();

                var controlledApprovalsCount = apprForBranch.Count(x => x.IsControlled);

                // for controlled dispensed logs, we cannot reliably map to branch because Log has no branchId.
                // we report per-branch by approvals (reliable) and system-wide log count separately.
                var controlledDispensedLogsCount = logs.Count(x => x.LogTypeId == 7);

                var logTypeCounts = logs
                    .GroupBy(x => new { x.LogTypeId, x.LogTypeName })
                    .Select(g => new ComplianceLogTypeCountRowDto
                    {
                        LogTypeId = g.Key.LogTypeId,
                        LogTypeName = string.IsNullOrWhiteSpace(g.Key.LogTypeName) ? $"Type {g.Key.LogTypeId}" : g.Key.LogTypeName,
                        Count = g.Count()
                    })
                    .OrderBy(x => x.LogTypeId)
                    .ToList();

                var empCounts = logs
                    .Where(x => x.UserId > 0)
                    .GroupBy(x => new { x.UserId, x.EmployeeName })
                    .Select(g => new ComplianceEmployeeActionCountsRowDto
                    {
                        EmployeeUserId = g.Key.UserId,
                        EmployeeName = string.IsNullOrWhiteSpace(g.Key.EmployeeName) ? $"User {g.Key.UserId}" : g.Key.EmployeeName,
                        InventoryChangeCount = g.Count(x => x.LogTypeId == 1),
                        AddRecordCount = g.Count(x => x.LogTypeId == 3),
                        EditRecordCount = g.Count(x => x.LogTypeId == 4),
                        DeleteRecordCount = g.Count(x => x.LogTypeId == 5),
                        PrescriptionApprovalCount = g.Count(x => x.LogTypeId == 6),
                        PrescriptionRejectionCount = g.Count(x => x.LogTypeId == 10),
                        ControlledDispensedCount = g.Count(x => x.LogTypeId == 7)
                    })
                    .OrderByDescending(x => x.PrescriptionApprovalCount + x.ControlledDispensedCount)
                    .ThenBy(x => x.EmployeeName)
                    .ToList();

                result.Branches.Add(new ComplianceBranchSectionDto
                {
                    BranchId = br.BranchId,
                    BranchName = br.BranchName,

                    Inventory = invForBranch,
                    NearExpiryInventory = nearExpiry.Where(x => x.BranchId == br.BranchId).ToList(),
                    ExpiredInventory = expired.Where(x => x.BranchId == br.BranchId).ToList(),
                    InventoryInsights = invInsights,

                    Orders = ordersForBranch,
                    DeliveryRequests = deliveryForBranch,

                    SupplierOrders = supplierOrdersForBranch,
                    Reorders = reordersForBranch,

                    Prescriptions = presForBranch,
                    Approvals = apprForBranch,

                    ControlledDispenseStats = new ComplianceControlledDispenseStatsDto
                    {
                        ControlledDispensedLogsCount = controlledDispensedLogsCount,
                        ControlledDispensedApprovalsCount = controlledApprovalsCount
                    },

                    LogTypeCounts = logTypeCounts,
                    EmployeeActionCounts = empCounts
                });
            }

            // overall summary for reflection page
            var branchByApprovals = result.Branches
                .Select(b => new { b.BranchName, Approvals = b.Approvals.Count, Controlled = b.Approvals.Count(x => x.IsControlled) })
                .ToList();

            var mostActive = branchByApprovals.OrderByDescending(x => x.Approvals).FirstOrDefault();
            var leastActive = branchByApprovals.OrderBy(x => x.Approvals).FirstOrDefault();

            var mostControlled = branchByApprovals.OrderByDescending(x => x.Controlled).FirstOrDefault();
            var leastControlled = branchByApprovals.OrderBy(x => x.Controlled).FirstOrDefault();

            result.Overall = new ComplianceOverallSummaryDto
            {
                MostActiveBranchName = mostActive?.BranchName,
                LeastActiveBranchName = leastActive?.BranchName,
                MostControlledDispenseBranchName = mostControlled?.BranchName,
                LeastControlledDispenseBranchName = leastControlled?.BranchName
            };

            return result;
        }


        public async Task<List<ReportTypeOptionDto>> GetReportTypesAsync()
        {
            return await _context.ReportTypes
                .OrderBy(rt => rt.ReportTypeName)
                .Select(rt => new ReportTypeOptionDto
                {
                    Value = rt.ReportTypeId,
                    Label = rt.ReportTypeName ?? $"Type {rt.ReportTypeId}"
                })
                .ToListAsync();
        }

        public async Task<int> CreateReportAsync(
            int? reportTypeId,
            int? userId,
            string reportName,
            string? description,
            byte[] pdfBytes,
            string fileName)
        {
            var entity = new Report
            {
                ReportTypeId = reportTypeId,
                UserId = userId,
                ReportName = reportName,
                ReportDescription = description,
                ReportDocument = pdfBytes,
                FileName = fileName,
                ContentType = "application/pdf",
                DocumentSizeBytes = pdfBytes?.Length ?? 0
            };

            _context.Reports.Add(entity);
            await _context.SaveChangesAsync();
            return entity.ReportId;
        }

        public async Task UpdateReportNameAsync(int reportId, string reportName)
        {
            if (reportId <= 0) return;

            var entity = await _context.Reports.FirstOrDefaultAsync(r => r.ReportId == reportId);
            if (entity == null) return;

            entity.ReportName = reportName;
            await _context.SaveChangesAsync();
        }

        public async Task<(byte[] bytes, string contentType, string fileName)?> GetReportDocumentAsync(int reportId)
        {
            if (reportId <= 0) return null;

            var r = await _context.Reports
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.ReportId == reportId);

            if (r?.ReportDocument == null || r.ReportDocument.Length == 0) return null;

            return (
                r.ReportDocument,
                string.IsNullOrWhiteSpace(r.ContentType) ? "application/pdf" : r.ContentType,
                string.IsNullOrWhiteSpace(r.FileName) ? $"report-{reportId}.pdf" : r.FileName
            );
        }

        public async Task<ReportDetailsDto?> GetReportDetailsAsync(int reportId)
        {
            if (reportId <= 0) return null;

            var query =
                from r in _context.Reports.AsNoTracking()
                where r.ReportId == reportId
                join rt in _context.ReportTypes on r.ReportTypeId equals rt.ReportTypeId into rtj
                from rt in rtj.DefaultIfEmpty()
                join u in _context.Users on r.UserId equals u.UserId into uj
                from u in uj.DefaultIfEmpty()
                select new ReportDetailsDto
                {
                    ReportId = r.ReportId,
                    ReportName = r.ReportName,
                    ReportDescription = r.ReportDescription,
                    ReportTypeId = r.ReportTypeId,
                    ReportTypeName = rt != null ? rt.ReportTypeName : null,
                    ReportCreationTimestamp = r.ReportCreationTimestamp,
                    GeneratedByUserId = r.UserId,
                    GeneratedByName = u != null ? ((u.FirstName ?? "") + " " + (u.LastName ?? "")).Trim() : null,
                    GeneratedByEmail = u != null ? u.EmailAddress : null,
                    FileName = r.FileName,
                    ContentType = r.ContentType,
                    DocumentSizeBytes = r.DocumentSizeBytes
                };

            return await query.FirstOrDefaultAsync();
        }
    }
}