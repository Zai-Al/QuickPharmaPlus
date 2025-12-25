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