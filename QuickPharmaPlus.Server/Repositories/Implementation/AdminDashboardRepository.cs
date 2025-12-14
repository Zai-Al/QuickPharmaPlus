using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Dashboard;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class AdminDashboardRepository : IAdminDashboardRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public AdminDashboardRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        public async Task<AdminDashboardDto> GetAdminDashboardDataAsync()
        {
            var today = DateTime.Today;

            // 1. Sales Per Branch
            var salesPerBranch = await _context.Orders
                .Include(o => o.Shipping)
                    .ThenInclude(s => s.Branch)
                        .ThenInclude(b => b.Address)
                            .ThenInclude(a => a.City)
                .Where(o => o.OrderTotal.HasValue && o.Shipping != null && o.Shipping.Branch != null)
                .GroupBy(o => o.Shipping!.Branch!.Address!.City!.CityName)
                .Select(g => new SalesPerBranchDto
                {
                    BranchCity = g.Key ?? "Unknown",
                    TotalSales = g.Sum(o => o.OrderTotal!.Value)
                })
                .ToListAsync();

            // 2. Inventory Per Branch
            var inventoryPerBranch = await _context.Inventories
                .Include(i => i.Branch)
                    .ThenInclude(b => b.Address)
                        .ThenInclude(a => a.City)
                .Where(i => i.Branch != null && i.Branch.Address != null && i.Branch.Address.City != null)
                .GroupBy(i => i.Branch!.Address!.City!.CityName)
                .Select(g => new InventoryPerBranchDto
                {
                    BranchCity = g.Key ?? "Unknown",
                    TotalInventory = g.Sum(i => i.InventoryQuantity ?? 0)
                })
                .ToListAsync();

            // 3. Prescriptions Dispensed Per Branch
            var prescriptionsPerBranch = await _context.ProductOrders
                .Include(po => po.Prescription)
                .Include(po => po.Order)
                    .ThenInclude(o => o.Shipping)
                        .ThenInclude(s => s.Branch)
                            .ThenInclude(b => b.Address)
                                .ThenInclude(a => a.City)
                .Where(po => po.Prescription != null &&
                             po.Order != null &&
                             po.Order.Shipping != null &&
                             po.Order.Shipping.Branch != null &&
                             po.Order.Shipping.Branch.Address != null &&
                             po.Order.Shipping.Branch.Address.City != null)
                .GroupBy(po => po.Order!.Shipping!.Branch!.Address!.City!.CityName)
                .Select(g => new PrescriptionsPerBranchDto
                {
                    BranchCity = g.Key ?? "Unknown",
                    TotalPrescriptions = g.Select(po => po.PrescriptionId).Distinct().Count()
                })
                .ToListAsync();

            // 4. Sales Per Category
            var salesPerCategory = await _context.ProductOrders
                .Include(po => po.Product)
                    .ThenInclude(p => p.Category)
                .Include(po => po.Order)
                .Where(po => po.Product != null &&
                             po.Product.Category != null &&
                             po.Order != null &&
                             po.Order.OrderTotal.HasValue)
                .GroupBy(po => po.Product!.Category!.CategoryName)
                .Select(g => new SalesPerCategoryDto
                {
                    CategoryName = g.Key ?? "Unknown",
                    TotalSales = g.Sum(po => po.Order!.OrderTotal!.Value)
                })
                .ToListAsync();

            // 5. Sales Per Supplier
            var salesPerSupplier = await _context.ProductOrders
                .Include(po => po.Product)
                    .ThenInclude(p => p.Supplier)
                .Include(po => po.Order)
                .Where(po => po.Product != null &&
                             po.Product.Supplier != null &&
                             po.Order != null &&
                             po.Order.OrderTotal.HasValue)
                .GroupBy(po => po.Product!.Supplier!.SupplierName)
                .Select(g => new SalesPerSupplierDto
                {
                    SupplierName = g.Key ?? "Unknown",
                    TotalSales = g.Sum(po => po.Order!.OrderTotal!.Value)
                })
                .ToListAsync();

            // 6. Total Sales Count
            var totalSalesCount = await _context.Orders.CountAsync();

            // 7. Today's Sales Count
            var todaysSalesCount = await _context.Orders
                .Include(o => o.Payment)
                .Where(o => o.Payment != null &&
                            o.Payment.PaymentTimestamp.HasValue &&
                            o.Payment.PaymentTimestamp.Value.Date == today)
                .CountAsync();

            // 8. Total Employees
            var employeeRoles = new[] { "Admin", "Manager", "Pharmacist", "Driver" };
            var totalEmployeesCount = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && employeeRoles.Contains(u.Role.RoleName!))
                .CountAsync();

            // 9. Total Suppliers Count (NEW)
            var totalSuppliersCount = await _context.Suppliers.CountAsync();

            // 10. Employees Per Branch
            var employeesPerBranch = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Branch)
                    .ThenInclude(b => b.Address)
                        .ThenInclude(a => a.City)
                .Where(u => u.Role != null &&
                            employeeRoles.Contains(u.Role.RoleName!) &&
                            u.Branch != null &&
                            u.Branch.Address != null &&
                            u.Branch.Address.City != null)
                .GroupBy(u => u.Branch!.Address!.City!.CityName)
                .Select(g => new EmployeesPerBranchDto
                {
                    BranchCity = g.Key ?? "Unknown",
                    EmployeeCount = g.Count()
                })
                .ToListAsync();

            // 11. Total Logs
            var totalLogsCount = await _context.Logs.CountAsync();

            // 12. Today's Logs
            var todaysLogsCount = await _context.Logs
                .Where(l => l.LogTimestamp.HasValue && l.LogTimestamp.Value.Date == today)
                .CountAsync();

            // 13. Total Reports
            var totalReportsCount = await _context.Reports.CountAsync();

            // 14. Today's Reports
            var todaysReportsCount = 0; // TODO: Update when Report model has creation date

            return new AdminDashboardDto
            {
                SalesPerBranch = salesPerBranch,
                InventoryPerBranch = inventoryPerBranch,
                PrescriptionsPerBranch = prescriptionsPerBranch,
                SalesPerCategory = salesPerCategory,
                SalesPerSupplier = salesPerSupplier,
                Metrics = new AdminDashboardMetricsDto
                {
                    TotalSalesCount = totalSalesCount,
                    TodaysSalesCount = todaysSalesCount,
                    TotalEmployeesCount = totalEmployeesCount,
                    TotalSuppliersCount = totalSuppliersCount, // NEW
                    EmployeesPerBranch = employeesPerBranch,
                    TotalLogsCount = totalLogsCount,
                    TodaysLogsCount = todaysLogsCount,
                    TotalReportsCount = totalReportsCount,
                    TodaysReportsCount = todaysReportsCount
                }
            };
        }
    }
}