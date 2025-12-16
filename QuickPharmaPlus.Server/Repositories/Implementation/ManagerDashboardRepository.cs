using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Dashboard;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class ManagerDashboardRepository : IManagerDashboardRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public ManagerDashboardRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        public async Task<ManagerDashboardDto> GetManagerDashboardDataAsync(int branchId)
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            // 1. Sales Per Supplier (for this specific branch)
            var salesPerSupplier = await _context.Orders
                .Include(o => o.Shipping)
                .Include(o => o.ProductOrders)
                    .ThenInclude(po => po.Product)
                        .ThenInclude(p => p.Supplier)
                .Where(o => o.Shipping != null && 
                            o.Shipping.BranchId == branchId && 
                            o.OrderTotal.HasValue)
                .SelectMany(o => o.ProductOrders
                    .Where(po => po.Product != null && po.Product.Supplier != null)
                    .Select(po => new
                    {
                        SupplierName = po.Product!.Supplier!.SupplierName,
                        OrderTotal = o.OrderTotal!.Value
                    }))
                .GroupBy(x => x.SupplierName)
                .Select(g => new SalesPerSupplierBranchDto
                {
                    SupplierName = g.Key ?? "Unknown",
                    TotalSales = g.Sum(x => x.OrderTotal)
                })
                .ToListAsync();

            // 2. Sales Per Category (for this specific branch)
            var salesPerCategory = await _context.Orders
                .Include(o => o.Shipping)
                .Include(o => o.ProductOrders)
                    .ThenInclude(po => po.Product)
                        .ThenInclude(p => p.Category)
                .Where(o => o.Shipping != null && 
                            o.Shipping.BranchId == branchId && 
                            o.OrderTotal.HasValue)
                .SelectMany(o => o.ProductOrders
                    .Where(po => po.Product != null && po.Product.Category != null)
                    .Select(po => new
                    {
                        CategoryName = po.Product!.Category!.CategoryName,
                        OrderTotal = o.OrderTotal!.Value
                    }))
                .GroupBy(x => x.CategoryName)
                .Select(g => new SalesPerCategoryBranchDto
                {
                    CategoryName = g.Key ?? "Unknown",
                    TotalSales = g.Sum(x => x.OrderTotal)
                })
                .ToListAsync();

            // 3. Prescription Approvals Per Pharmacist (for this branch)
            var approvalsPerPharmacist = await _context.Approvals
                .Include(a => a.User)
                    .ThenInclude(u => u.Role)
                .Include(a => a.User)
                    .ThenInclude(u => u.Branch)
                .Where(a => a.User != null && 
                            a.User.BranchId == branchId && 
                            a.User.Role != null && 
                            a.User.Role.RoleName == "Pharmacist")
                .GroupBy(a => new
                {
                    FirstName = a.User!.FirstName,
                    LastName = a.User!.LastName
                })
                .Select(g => new PrescriptionApprovalsPerPharmacistDto
                {
                    PharmacistName = (g.Key.FirstName ?? "") + " " + (g.Key.LastName ?? ""),
                    TotalApprovals = g.Count()
                })
                .ToListAsync();

            // 4. Total Branch Sales (total monetary amount)
            var totalBranchSales = await _context.Orders
                .Include(o => o.Shipping)
                .Where(o => o.Shipping != null && 
                            o.Shipping.BranchId == branchId && 
                            o.OrderTotal.HasValue)
                .SumAsync(o => o.OrderTotal!.Value);

            // 5. Today's Branch Sales (total monetary amount)
            var todayBranchSales = await _context.Orders
                .Include(o => o.Shipping)
                .Include(o => o.Payment)
                .Where(o => o.Shipping != null && 
                            o.Shipping.BranchId == branchId && 
                            o.Payment != null && 
                            o.Payment.PaymentTimestamp.HasValue && 
                            o.Payment.PaymentTimestamp.Value.Date == today &&
                            o.OrderTotal.HasValue)
                .SumAsync(o => o.OrderTotal!.Value);

            // 6. Total Branch Employees
            var employeeRoles = new[] { "Admin", "Manager", "Pharmacist", "Driver" };
            var totalBranchEmployees = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.BranchId == branchId && 
                            u.Role != null && 
                            employeeRoles.Contains(u.Role.RoleName!))
                .CountAsync();

            // 7. Total Branch Prescriptions (Approved or Pending Approval)
            var totalBranchPrescriptions = await _context.Approvals
                .Include(a => a.User)
                .Where(a => a.User != null && a.User.BranchId == branchId)
                .Select(a => a.PrescriptionId)
                .Distinct()
                .CountAsync();

            // 8. Total Branch Deliveries
            var totalBranchDeliveries = await _context.Shippings
                .Where(s => s.BranchId == branchId)
                .CountAsync();


            // 9. Today's Branch Deliveries
            var todayBranchDeliveries = await _context.Shippings
                .Where(s => s.BranchId == branchId &&
                s.ShippingDate.HasValue &&
                s.ShippingDate.Value >= today &&
                s.ShippingDate.Value < tomorrow)
                .CountAsync();

            // 10. Total Branch Inventory (sum of all inventory quantities)
            var totalBranchInventory = await _context.Inventories
                .Where(i => i.BranchId == branchId && 
                            (i.InventoryQuantity ?? 0) > 0)
                .SumAsync(i => i.InventoryQuantity ?? 0);

            // 11. Total Branch Orders (customer orders, not supplier orders)
            var totalBranchOrders = await _context.Orders
                .Include(o => o.Shipping)
                .Where(o => o.Shipping != null && o.Shipping.BranchId == branchId)
                .CountAsync();

            return new ManagerDashboardDto
            {
                SalesPerSupplier = salesPerSupplier,
                SalesPerCategory = salesPerCategory,
                PrescriptionApprovalsPerPharmacist = approvalsPerPharmacist,
                Metrics = new ManagerDashboardMetricsDto
                {
                    TotalBranchSales = totalBranchSales,
                    TodayBranchSales = todayBranchSales,
                    TotalBranchEmployees = totalBranchEmployees,
                    TotalBranchPrescriptions = totalBranchPrescriptions,
                    TotalBranchDeliveries = totalBranchDeliveries,
                    TodayBranchDeliveries = todayBranchDeliveries,
                    TotalBranchInventory = totalBranchInventory,
                    TotalBranchOrders = totalBranchOrders
                }
            };
        }
    }
}