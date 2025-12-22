using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.SupplierOrder;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Pharmacist,Manager")]
    public class SupplierOrderController : ControllerBase
    {
        private readonly ISupplierOrderRepository _repo;
        private readonly IQuickPharmaLogRepository _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly QuickPharmaPlusDbContext _context;

        // Validation patterns (match frontend)
        private static readonly Regex ValidIdPattern = new(@"^[0-9]*$");
        private static readonly Regex ValidNamePattern = new(@"^[A-Za-z0-9 .\-+]*$");
        private static readonly Regex ValidQuantityPattern = new(@"^[1-9][0-9]*$");

        public SupplierOrderController(
            ISupplierOrderRepository repo,
            IQuickPharmaLogRepository logger,
            UserManager<ApplicationUser> userManager,
            QuickPharmaPlusDbContext context)
        {
            _repo = repo;
            _logger = logger;
            _userManager = userManager;
            _context = context;
        }

        // ================================
        // HELPER: GET CURRENT USER ID
        // ================================
        private async Task<int?> GetCurrentUserIdAsync()
        {
            var userEmail = User?.Identity?.Name;
            if (string.IsNullOrEmpty(userEmail))
                return null;

            var identityUser = await _userManager.FindByEmailAsync(userEmail);
            if (identityUser == null)
                return null;

            var domainUser = await _context.Users
                .FirstOrDefaultAsync(u => u.EmailAddress == userEmail);

            return domainUser?.UserId;
        }

        // ================================
        // HELPER: CHECK IF USER IS ADMIN
        // ================================
        private async Task<bool> IsUserAdminAsync()
        {
            var userEmail = User?.Identity?.Name;
            if (string.IsNullOrEmpty(userEmail))
                return false;

            var identityUser = await _userManager.FindByEmailAsync(userEmail);
            if (identityUser == null)
                return false;

            var roles = await _userManager.GetRolesAsync(identityUser);
            return roles.Contains("Admin");
        }

        // =============================================================
        // GET: api/SupplierOrder?pageNumber=1&pageSize=10&search=...
        // =============================================================
        // =============================================================
        // GET: api/SupplierOrder?pageNumber=1&pageSize=10&search=...
        // =============================================================
        [Authorize(Roles = "Admin,Pharmacist,Manager")]
        [HttpGet]
        public async Task<IActionResult> GetAll(
            int pageNumber = 1,
            int pageSize = 10,
            string? search = null,
            DateOnly? orderDate = null,
            int? branchId = null,
            int? statusId = null,
            int? typeId = null)
        {
            // ============================
            // BASIC VALIDATION
            // ============================

            if (pageNumber <= 0 || pageSize <= 0)
                return BadRequest("Page number and page size must be positive.");

            if (branchId.HasValue && branchId.Value <= 0)
                return BadRequest("Invalid branch ID.");

            if (statusId.HasValue && statusId.Value <= 0)
                return BadRequest("Invalid status ID.");

            if (typeId.HasValue && typeId.Value <= 0)
                return BadRequest("Invalid type ID.");

            // ============================
            // ROLE-BASED BRANCH ISOLATION
            // ============================

            var identityUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(identityUserId))
                return Unauthorized();

            bool isAdmin = User.IsInRole("Admin");

            int? effectiveBranchId;

            if (isAdmin)
            {
                // Admin can see all or filter by branch
                effectiveBranchId = branchId;
            }
            else
            {
                // Non-admin → force branch from DOMAIN User table
                var domainUser = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.IdentityUserId == identityUserId);

                if (domainUser == null)
                    return Forbid("Domain user record not found.");

                if (!domainUser.BranchId.HasValue)
                    return Forbid("User is not assigned to a branch.");

                effectiveBranchId = domainUser.BranchId.Value;
            }

            // ============================
            // FETCH DATA
            // ============================

            var result = await _repo.GetAllSupplierOrdersAsync(
                pageNumber,
                pageSize,
                search,
                orderDate,
                effectiveBranchId,
                statusId,
                typeId
            );

            return Ok(new
            {
                items = result.Items,
                totalCount = result.TotalCount,
                pageNumber,
                pageSize
            });
        }


        // =============================================================
        // GET: api/SupplierOrder/{id}
        // =============================================================
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid supplier order ID.");

            var supplierOrder = await _repo.GetSupplierOrderByIdAsync(id);

            if (supplierOrder == null)
                return NotFound("Supplier order not found.");

            return Ok(supplierOrder);
        }

        // =============================================================
        // GET: api/SupplierOrder/statuses
        // =============================================================
        [HttpGet("statuses")]
        public async Task<IActionResult> GetStatuses()
        {
            var statuses = await _context.SupplierOrderStatuses
                .Select(s => new
                {
                    statusId = s.ProductOrderStatusId,
                    statusType = s.ProductOrderStatusType
                })
                .ToListAsync();

            return Ok(statuses);
        }

        // =============================================================
        // GET: api/SupplierOrder/types
        // =============================================================
        [HttpGet("types")]
        public async Task<IActionResult> GetTypes()
        {
            var types = await _context.SupplierOrderTypes
                .Select(t => new
                {
                    typeId = t.SupplierOrderTypeId,
                    typeName = t.SupplierOrderTypeName
                })
                .ToListAsync();

            return Ok(types);
        }

        // =============================================================
        // GET: api/SupplierOrder/supplier/{supplierId}/products
        // Get products for a specific supplier
        // =============================================================
        [HttpGet("supplier/{supplierId}/products")]
        public async Task<IActionResult> GetProductsForSupplier(int supplierId)
        {
            if (supplierId <= 0)
                return BadRequest("Invalid supplier ID.");

            var products = await _context.Products
                .Where(p => p.SupplierId == supplierId && p.IsActive)
                .Select(p => new
                {
                    productId = p.ProductId,
                    productName = p.ProductName
                })
                .ToListAsync();

            return Ok(products);
        }

        // =============================================================
        // POST: api/SupplierOrder
        // =============================================================
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SupplierOrderCreateDto model)
        {
            if (model == null)
                return BadRequest("Supplier order data is required.");

            // 1. Validate supplier
            if (!model.SupplierId.HasValue || model.SupplierId.Value <= 0)
                return BadRequest("Supplier must be selected.");

            // 2. Validate product
            if (!model.ProductId.HasValue || model.ProductId.Value <= 0)
                return BadRequest("Product must be selected.");

            // 3. Validate quantity
            if (!model.Quantity.HasValue || model.Quantity.Value <= 0)
                return BadRequest("Quantity must be greater than 0.");

            if (!ValidQuantityPattern.IsMatch(model.Quantity.Value.ToString()))
                return BadRequest("Quantity must be a positive integer greater than 0 (no decimals).");

            // 4. Get current user ID
            var currentUserId = await GetCurrentUserIdAsync();
            if (!currentUserId.HasValue)
                return Unauthorized("User not found.");

            // 5. Get user's branch ID (or from model if admin)
            int branchId;
            bool isAdmin = await IsUserAdminAsync();

            if (isAdmin && model.BranchId.HasValue && model.BranchId.Value > 0)
            {
                // Admin can specify branch
                branchId = model.BranchId.Value;
            }
            else
            {
                // Get employee's branch
                var employeeBranch = await _context.Users
                    .Where(u => u.UserId == currentUserId.Value)
                    .Select(u => new { u.BranchId })
                    .FirstOrDefaultAsync();

                if (employeeBranch == null || !employeeBranch.BranchId.HasValue)
                    return BadRequest("Employee branch not found.");

                branchId = employeeBranch.BranchId.Value;
            }

            // 6. Verify product belongs to supplier
            var productExists = await _context.Products
                .AnyAsync(p => p.ProductId == model.ProductId.Value &&
                              p.SupplierId == model.SupplierId.Value &&
                              p.IsActive);

            if (!productExists)
                return BadRequest("Product does not belong to the selected supplier.");

            // 7. Create supplier order
            var supplierOrder = new SupplierOrder
            {
                SupplierId = model.SupplierId.Value,
                ProductId = model.ProductId.Value,
                SupplierOrderQuantity = model.Quantity.Value,
                EmployeeId = currentUserId.Value,
                BranchId = branchId,
                SupplierOrderStatusId = 1, // Pending (as per your requirement)
                SupplierOrderTypeId = 1, // Manual (as per your requirement)
                SupplierOrderDate = DateTime.Now
            };

            var created = await _repo.AddSupplierOrderAsync(supplierOrder);

            // =================== CREATE DETAILED LOG ===================
            // Get related entity names for better log details
            var supplier = await _context.Suppliers.FindAsync(model.SupplierId.Value);
            var product = await _context.Products.FindAsync(model.ProductId.Value);
            var employeeDetails = await _context.Users.FindAsync(currentUserId.Value);

            var details = $"Supplier: {supplier?.SupplierName ?? "Unknown"}, " +
                          $"Product: {product?.ProductName ?? "Unknown"}, " +
                          $"Quantity: {model.Quantity.Value}, " +
                          $"Branch ID: {branchId}, " +
                          $"Employee: {employeeDetails?.FirstName} {employeeDetails?.LastName}, " +
                          $"Status: Pending, " +
                          $"Type: Manual";

            await _logger.CreateAddRecordLogAsync(
                userId: currentUserId.Value,
                tableName: "SupplierOrder",
                recordId: created.SupplierOrderId,
                details: details
            );

            return Ok(new
            {
                message = "Supplier order created successfully.",
                supplierOrder = created
            });
        }

        // =============================================================
        // PUT: api/SupplierOrder/{id}
        // =============================================================
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] SupplierOrderCreateDto model)
        {
            if (model == null)
                return BadRequest("Supplier order data is required.");

            if (id <= 0)
                return BadRequest("Invalid supplier order ID.");

            // 1. Validate supplier
            if (!model.SupplierId.HasValue || model.SupplierId.Value <= 0)
                return BadRequest("Supplier must be selected.");

            // 2. Validate product
            if (!model.ProductId.HasValue || model.ProductId.Value <= 0)
                return BadRequest("Product must be selected.");

            // 3. Validate quantity
            if (!model.Quantity.HasValue || model.Quantity.Value <= 0)
                return BadRequest("Quantity must be greater than 0.");

            if (!ValidQuantityPattern.IsMatch(model.Quantity.Value.ToString()))
                return BadRequest("Quantity must be a positive integer greater than 0 (no decimals).");

            // 4. Get existing order
            var existingOrder = await _context.SupplierOrders
                .Include(o => o.Supplier)
                .Include(o => o.Product)
                .Include(o => o.Employee)
                .Include(o => o.Branch)
                    .ThenInclude(b => b.Address)
                        .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(o => o.SupplierOrderId == id);

            if (existingOrder == null)
                return NotFound("Supplier order not found.");

            // 5. Get current user ID
            var currentUserId = await GetCurrentUserIdAsync();
            if (!currentUserId.HasValue)
                return Unauthorized("User not found.");

            // 6. Determine branch ID (same logic as Create)
            int branchId;
            bool isAdmin = await IsUserAdminAsync();

            if (isAdmin && model.BranchId.HasValue && model.BranchId.Value > 0)
            {
                // Admin can specify branch
                branchId = model.BranchId.Value;
            }
            else
            {
                // Get employee's branch
                var employeeBranch = await _context.Users
                    .Where(u => u.UserId == currentUserId.Value)
                    .Select(u => new { u.BranchId })
                    .FirstOrDefaultAsync();

                if (employeeBranch == null || !employeeBranch.BranchId.HasValue)
                    return BadRequest("Employee branch not found.");

                branchId = employeeBranch.BranchId.Value;
            }

            // 7. Verify product belongs to supplier
            var productExists = await _context.Products
                .AnyAsync(p => p.ProductId == model.ProductId.Value &&
                              p.SupplierId == model.SupplierId.Value &&
                              p.IsActive);

            if (!productExists)
                return BadRequest("Product does not belong to the selected supplier.");

            // =================== TRACK CHANGES ===================
            var changes = new List<string>();

            // Get old entity names
            var oldSupplierName = existingOrder.Supplier?.SupplierName ?? "Unknown";
            var oldProductName = existingOrder.Product?.ProductName ?? "Unknown";
            var oldQuantity = existingOrder.SupplierOrderQuantity ?? 0;
            var oldBranchName = existingOrder.Branch?.Address?.City?.CityName ?? "Unknown";

            // Get new entity names
            var newSupplier = await _context.Suppliers.FindAsync(model.SupplierId.Value);
            var newProduct = await _context.Products.FindAsync(model.ProductId.Value);
            var newBranch = await _context.Branches
                .Include(b => b.Address)
                    .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(b => b.BranchId == branchId);

            var newSupplierName = newSupplier?.SupplierName ?? "Unknown";
            var newProductName = newProduct?.ProductName ?? "Unknown";
            var newBranchName = newBranch?.Address?.City?.CityName ?? "Unknown";

            // Track changes
            if (existingOrder.SupplierId != model.SupplierId.Value)
                changes.Add($"Supplier: '{oldSupplierName}' → '{newSupplierName}'");

            if (existingOrder.ProductId != model.ProductId.Value)
                changes.Add($"Product: '{oldProductName}' → '{newProductName}'");

            if (existingOrder.SupplierOrderQuantity != model.Quantity.Value)
                changes.Add($"Quantity: {oldQuantity} → {model.Quantity.Value}");

            if (existingOrder.BranchId != branchId)
                changes.Add($"Branch: '{oldBranchName}' → '{newBranchName}'");

            // 8. Update supplier order
            existingOrder.SupplierId = model.SupplierId.Value;
            existingOrder.ProductId = model.ProductId.Value;
            existingOrder.SupplierOrderQuantity = model.Quantity.Value;
            existingOrder.BranchId = branchId;

            await _context.SaveChangesAsync();

            // =================== CREATE DETAILED LOG ===================
            if (currentUserId.HasValue && changes.Any())
            {
                var employeeDetails = await _context.Users.FindAsync(currentUserId.Value);
                var details = $"Order ID: {id}, Supplier: {newSupplierName}, Product: {newProductName}, " +
                              $"Quantity: {model.Quantity.Value}, Branch: {newBranchName} - Changes: {string.Join(", ", changes)}";

                await _logger.CreateEditRecordLogAsync(
                    userId: currentUserId.Value,
                    tableName: "SupplierOrder",
                    recordId: id,
                    details: details
                );
            }

            return Ok(new
            {
                message = "Supplier order updated successfully.",
                supplierOrder = existingOrder
            });
        }

        // =============================================================
        // DELETE: api/SupplierOrder/{id}
        // =============================================================
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid supplier order ID.");

            // =================== GET ORDER DETAILS BEFORE DELETION ===================
            var orderToDelete = await _context.SupplierOrders
                .Include(o => o.Supplier)
                .Include(o => o.Product)
                .Include(o => o.Employee)
                .Include(o => o.Branch)
                    .ThenInclude(b => b.Address)
                        .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(o => o.SupplierOrderId == id);

            if (orderToDelete == null)
                return NotFound("Supplier order not found.");

            // Store details for logging
            var supplierName = orderToDelete.Supplier?.SupplierName ?? "Unknown";
            var productName = orderToDelete.Product?.ProductName ?? "Unknown";
            var quantity = orderToDelete.SupplierOrderQuantity ?? 0;
            var branchName = orderToDelete.Branch?.Address?.City?.CityName ?? "Unknown";
            var employeeName = orderToDelete.Employee != null 
                ? $"{orderToDelete.Employee.FirstName} {orderToDelete.Employee.LastName}".Trim() 
                : "Unknown";

            // Get current user ID
            var currentUserId = await GetCurrentUserIdAsync();

            // Delete the order
            _context.SupplierOrders.Remove(orderToDelete);
            await _context.SaveChangesAsync();

            // =================== CREATE DETAILED LOG ===================
            if (currentUserId.HasValue)
            {
                var details = $"Order ID: {id}, Supplier: {supplierName}, Product: {productName}, " +
                              $"Quantity: {quantity}, Branch: {branchName}, Employee: {employeeName}";

                await _logger.CreateDeleteRecordLogAsync(
                    userId: currentUserId.Value,
                    tableName: "SupplierOrder",
                    recordId: id,
                    details: details
                );
            }

            return Ok(new { deleted = true, message = "Supplier order deleted successfully." });
        }
    }
}
