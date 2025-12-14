using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.SupplierOrder;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class SupplierOrderRepository : ISupplierOrderRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        // Validation patterns (matching frontend standards)
        private static readonly Regex ValidIdPattern = new(@"^[0-9]*$");
        private static readonly Regex ValidNamePattern = new(@"^[A-Za-z0-9 .\-+]*$");

        public SupplierOrderRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        // =============================================================
        // PAGED + FILTERED SUPPLIER ORDER LIST
        // =============================================================
        public async Task<PagedResult<SupplierOrderListDto>> GetAllSupplierOrdersAsync(
            int pageNumber,
            int pageSize,
            string? search = null,
            DateOnly? orderDate = null)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            // Base query with all related entities including Branch → Address → City
            var query = _context.SupplierOrders
                .Include(so => so.Supplier)
                .Include(so => so.Employee)
                .Include(so => so.Product)
                .Include(so => so.SupplierOrderType)
                .Include(so => so.Branch)
                    .ThenInclude(b => b.Address)
                        .ThenInclude(a => a.City)
                .AsQueryable();

            // =============================================================
            // SAFE SEARCH SANITIZATION
            // =============================================================
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();

                // Validate search input
                bool validName = ValidNamePattern.IsMatch(search);
                bool validId = ValidIdPattern.IsMatch(search);

                if (!validName && !validId)
                {
                    // Return empty result for invalid input
                    return new PagedResult<SupplierOrderListDto>
                    {
                        Items = new List<SupplierOrderListDto>(),
                        TotalCount = 0
                    };
                }

                // ID exact match
                if (int.TryParse(search, out int idVal))
                {
                    query = query.Where(so => so.SupplierOrderId == idVal);
                }
                else
                {
                    // Name search (supplier name, product name, or employee name)
                    var lower = search.ToLower();
                    query = query.Where(so =>
                        (so.Supplier != null && (so.Supplier.SupplierName ?? "").ToLower().StartsWith(lower)) ||
                        (so.Product != null && (so.Product.ProductName ?? "").ToLower().StartsWith(lower)) ||
                        (so.Employee != null && 
                            ((so.Employee.FirstName ?? "") + " " + (so.Employee.LastName ?? "")).ToLower().StartsWith(lower))
                    );
                }
            }

            // =============================================================
            // ORDER DATE FILTER (DateOnly safe comparison - similar to Inventory)
            // =============================================================
            if (orderDate.HasValue)
            {
                var dateFilter = orderDate.Value;
                query = query.Where(so =>
                    so.SupplierOrderDate.HasValue &&
                    DateOnly.FromDateTime(so.SupplierOrderDate.Value) == dateFilter
                );
            }

            // Count AFTER filtering
            var total = await query.CountAsync();

            // Fetch SupplierOrderStatuses separately since it's keyless
            var statusList = await _context.SupplierOrderStatuses.ToListAsync();
            var statusDict = statusList.ToDictionary(s => s.ProductOrderStatusId, s => s.ProductOrderStatusType);

            // Apply paging + projection
            var items = await query
                .OrderByDescending(so => so.SupplierOrderDate ?? DateTime.MinValue)
                .ThenBy(so => so.SupplierOrderId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(so => new SupplierOrderListDto
                {
                    SupplierOrderId = so.SupplierOrderId,
                    SupplierOrderDate = so.SupplierOrderDate,
                    SupplierOrderQuantity = so.SupplierOrderQuantity,
                    SupplierOrderStatusId = so.SupplierOrderStatusId,
                    // Status will be populated after query
                    SupplierId = so.SupplierId,
                    SupplierName = so.Supplier != null ? so.Supplier.SupplierName : null,
                    EmployeeId = so.EmployeeId,
                    EmployeeFullName = so.Employee != null 
                        ? (so.Employee.FirstName ?? "") + " " + (so.Employee.LastName ?? "")
                        : null,
                    ProductId = so.ProductId,
                    ProductName = so.Product != null ? so.Product.ProductName : null,
                    SupplierOrderTypeId = so.SupplierOrderTypeId,
                    SupplierOrderTypeName = so.SupplierOrderType != null 
                        ? so.SupplierOrderType.SupplierOrderTypeName 
                        : null,
                    BranchId = so.BranchId,
                    BranchName = so.Branch != null && so.Branch.Address != null && so.Branch.Address.City != null
                        ? so.Branch.Address.City.CityName
                        : null
                })
                .ToListAsync();

            // Populate status from dictionary
            foreach (var item in items)
            {
                if (item.SupplierOrderStatusId.HasValue && 
                    statusDict.TryGetValue(item.SupplierOrderStatusId.Value, out var statusType))
                {
                    item.SupplierOrderStatusType = statusType;
                }
            }

            return new PagedResult<SupplierOrderListDto>
            {
                Items = items,
                TotalCount = total
            };
        }

        // =============================================================
        // GET SUPPLIER ORDER DETAILS BY ID
        // =============================================================
        public async Task<SupplierOrderDetailDto?> GetSupplierOrderByIdAsync(int id)
        {
            var supplierOrder = await _context.SupplierOrders
                .Include(so => so.Supplier)
                .Include(so => so.Employee)
                .Include(so => so.Product)
                .Include(so => so.SupplierOrderType)
                .Include(so => so.Branch)
                    .ThenInclude(b => b.Address)
                        .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(so => so.SupplierOrderId == id);

            if (supplierOrder == null) return null;

            // Fetch status separately
            string? statusType = null;
            if (supplierOrder.SupplierOrderStatusId.HasValue)
            {
                var status = await _context.SupplierOrderStatuses
                    .FirstOrDefaultAsync(s => s.ProductOrderStatusId == supplierOrder.SupplierOrderStatusId.Value);
                statusType = status?.ProductOrderStatusType;
            }

            return new SupplierOrderDetailDto
            {
                SupplierOrderId = supplierOrder.SupplierOrderId,
                SupplierOrderDate = supplierOrder.SupplierOrderDate,
                SupplierOrderQuantity = supplierOrder.SupplierOrderQuantity,
                SupplierOrderStatusId = supplierOrder.SupplierOrderStatusId,
                SupplierOrderStatusType = statusType,
                SupplierId = supplierOrder.SupplierId,
                SupplierName = supplierOrder.Supplier?.SupplierName,
                SupplierContact = supplierOrder.Supplier?.SupplierContact,
                SupplierEmail = supplierOrder.Supplier?.SupplierEmail,
                EmployeeId = supplierOrder.EmployeeId,
                EmployeeFullName = supplierOrder.Employee != null 
                    ? (supplierOrder.Employee.FirstName ?? "") + " " + (supplierOrder.Employee.LastName ?? "")
                    : null,
                EmployeeEmail = supplierOrder.Employee?.EmailAddress,
                ProductId = supplierOrder.ProductId,
                ProductName = supplierOrder.Product?.ProductName,
                ProductDescription = supplierOrder.Product?.ProductDescription,
                ProductPrice = supplierOrder.Product?.ProductPrice,
                SupplierOrderTypeId = supplierOrder.SupplierOrderTypeId,
                SupplierOrderTypeName = supplierOrder.SupplierOrderType?.SupplierOrderTypeName,
                BranchId = supplierOrder.BranchId,
                BranchName = supplierOrder.Branch?.Address?.City?.CityName
            };
        }

        // =============================================================
        // CREATE NEW SUPPLIER ORDER
        // =============================================================
        public async Task<SupplierOrder> AddSupplierOrderAsync(SupplierOrder supplierOrder)
        {
            _context.SupplierOrders.Add(supplierOrder);
            await _context.SaveChangesAsync();
            return supplierOrder;
        }

        // =============================================================
        // UPDATE EXISTING SUPPLIER ORDER
        // =============================================================
        public async Task<SupplierOrder?> UpdateSupplierOrderAsync(SupplierOrder supplierOrder)
        {
            var existing = await _context.SupplierOrders
                .FirstOrDefaultAsync(so => so.SupplierOrderId == supplierOrder.SupplierOrderId);

            if (existing == null) return null;

            existing.SupplierOrderDate = supplierOrder.SupplierOrderDate;
            existing.SupplierOrderQuantity = supplierOrder.SupplierOrderQuantity;
            existing.SupplierOrderStatusId = supplierOrder.SupplierOrderStatusId;
            existing.SupplierId = supplierOrder.SupplierId;
            existing.EmployeeId = supplierOrder.EmployeeId;
            existing.ProductId = supplierOrder.ProductId;
            existing.SupplierOrderTypeId = supplierOrder.SupplierOrderTypeId;
            existing.BranchId = supplierOrder.BranchId;

            await _context.SaveChangesAsync();
            return existing;
        }

        // =============================================================
        // DELETE SUPPLIER ORDER
        // =============================================================
        public async Task<bool> DeleteSupplierOrderAsync(int id)
        {
            var existing = await _context.SupplierOrders
                .FirstOrDefaultAsync(so => so.SupplierOrderId == id);

            if (existing == null) return false;

            _context.SupplierOrders.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
