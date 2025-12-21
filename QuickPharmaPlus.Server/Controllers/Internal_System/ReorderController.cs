using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Reorder;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize(Roles = "Admin,Pharmacist,Manager")]
    public class ReorderController : ControllerBase
    {
        private readonly IReorderRepository _repo;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly QuickPharmaPlusDbContext _context;
        private readonly IQuickPharmaLogRepository _logger;

        // Validation patterns (match frontend)
        private static readonly Regex ValidIdPattern = new(@"^[0-9]*$");
        private static readonly Regex ValidNamePattern = new(@"^[A-Za-z0-9 .\-+]*$");
        private static readonly Regex ValidQuantityPattern = new(@"^[1-9][0-9]*$");

        public ReorderController(
            IReorderRepository repo,
            UserManager<ApplicationUser> userManager,
            QuickPharmaPlusDbContext context,
            IQuickPharmaLogRepository logger)
        {
            _repo = repo;
            _userManager = userManager;
            _context = context;
            _logger = logger;
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
        // GET: api/Reorder?pageNumber=1&pageSize=10&search=...
        // =============================================================
        [HttpGet]
        public async Task<IActionResult> GetAll(
            int pageNumber = 1,
            int pageSize = 10,
            string? search = null)
        {
            // Validation
            if (pageNumber <= 0 || pageSize <= 0)
                return BadRequest("Page number and page size must be positive.");

            // Validate search text
            if (!string.IsNullOrWhiteSpace(search))
            {
                var trimmed = search.Trim();

                // If numeric → must match ID pattern
                if (int.TryParse(trimmed, out _))
                {
                    if (!ValidIdPattern.IsMatch(trimmed))
                        return BadRequest("Reorder ID must contain only numbers.");
                }
                else
                {
                    // Otherwise validate as name search
                    if (!ValidNamePattern.IsMatch(trimmed))
                        return BadRequest("Search may only contain letters, numbers, spaces, +, -, and dots.");
                }
            }

            var result = await _repo.GetAllReordersAsync(pageNumber, pageSize, search);

            return Ok(new
            {
                items = result.Items,
                totalCount = result.TotalCount,
                pageNumber,
                pageSize
            });
        }

        // =============================================================
        // GET: api/Reorder/{id}
        // =============================================================
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid reorder ID.");

            var reorder = await _repo.GetReorderByIdAsync(id);

            if (reorder == null)
                return NotFound("Reorder not found.");

            return Ok(reorder);
        }

        // =============================================================
        // POST: api/Reorder
        // =============================================================
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ReorderCreateDto model)
        {
            if (model == null)
                return BadRequest("Reorder data is required.");

            // 1. Validate supplier
            if (!model.SupplierId.HasValue || model.SupplierId.Value <= 0)
                return BadRequest("Supplier must be selected.");

            // 2. Validate product
            if (!model.ProductId.HasValue || model.ProductId.Value <= 0)
                return BadRequest("Product must be selected.");

            // 3. Validate threshold
            if (!model.Threshold.HasValue || model.Threshold.Value <= 0)
                return BadRequest("Threshold must be greater than 0.");

            if (!ValidQuantityPattern.IsMatch(model.Threshold.Value.ToString()))
                return BadRequest("Threshold must be a positive integer greater than 0 (no decimals).");

            // 4. Validate quantity
            if (!model.Quantity.HasValue || model.Quantity.Value <= 0)
                return BadRequest("Quantity must be greater than 0.");

            if (!ValidQuantityPattern.IsMatch(model.Quantity.Value.ToString()))
                return BadRequest("Quantity must be a positive integer greater than 0 (no decimals).");

            // 5. Get current user ID
            var currentUserId = await GetCurrentUserIdAsync();
            if (!currentUserId.HasValue)
                return Unauthorized("User not found.");

            // 6. Get user's branch ID (or from model if admin)
            int branchId;
            bool isAdmin = await IsUserAdminAsync();

            if (isAdmin && model.BranchId.HasValue && model.BranchId.Value > 0)
            {
                branchId = model.BranchId.Value;
            }
            else
            {
                var employeeBranch = await _context.Users
                    .Where(u => u.UserId == currentUserId.Value)
                    .Select(u => new { u.BranchId })
                    .FirstOrDefaultAsync();

                if (employeeBranch == null || !employeeBranch.BranchId.HasValue)
                    return BadRequest("Employee branch not found.");

                branchId = employeeBranch.BranchId.Value;
            }

            // 7. Create reorder
            var reorder = new Reorder
            {
                SupplierId = model.SupplierId.Value,
                ProductId = model.ProductId.Value,
                ReorderThershold = model.Threshold.Value,
                ReorderQuantity = model.Quantity.Value,
                UserId = currentUserId.Value,
                BranchId = branchId
            };

            var created = await _repo.AddReorderAsync(reorder);

            // 8. Log creation
            var supplier = await _context.Suppliers.FindAsync(model.SupplierId.Value);
            var product = await _context.Products.FindAsync(model.ProductId.Value);
            var employeeDetails = await _context.Users.FindAsync(currentUserId.Value);

            var details = $"Supplier: {supplier?.SupplierName ?? "Unknown"}, " +
                          $"Product: {product?.ProductName ?? "Unknown"}, " +
                          $"Threshold: {model.Threshold.Value}, " +
                          $"Quantity: {model.Quantity.Value}, " +
                          $"Branch ID: {branchId}, " +
                          $"Employee: {employeeDetails?.FirstName} {employeeDetails?.LastName}";

            await _logger.CreateAddRecordLogAsync(
                userId: currentUserId.Value,
                tableName: "Reorder",
                recordId: created.ReorderId,
                details: details
            );

            return CreatedAtAction(nameof(GetById), new { id = created.ReorderId }, created);
        }

        // =============================================================
        // PUT: api/Reorder/{id}
        // =============================================================
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] ReorderCreateDto model)
        {
            if (model == null)
                return BadRequest("Reorder data is required.");

            if (id <= 0)
                return BadRequest("Invalid reorder ID.");

            // 1. Validate supplier
            if (!model.SupplierId.HasValue || model.SupplierId.Value <= 0)
                return BadRequest("Supplier must be selected.");

            // 2. Validate product
            if (!model.ProductId.HasValue || model.ProductId.Value <= 0)
                return BadRequest("Product must be selected.");

            // 3. Validate threshold
            if (!model.Threshold.HasValue || model.Threshold.Value <= 0)
                return BadRequest("Threshold must be greater than 0.");

            if (!ValidQuantityPattern.IsMatch(model.Threshold.Value.ToString()))
                return BadRequest("Threshold must be a positive integer greater than 0 (no decimals).");

            // 4. Validate quantity
            if (!model.Quantity.HasValue || model.Quantity.Value <= 0)
                return BadRequest("Quantity must be greater than 0.");

            if (!ValidQuantityPattern.IsMatch(model.Quantity.Value.ToString()))
                return BadRequest("Quantity must be a positive integer greater than 0 (no decimals).");

            // 5. Get current user ID
            var currentUserId = await GetCurrentUserIdAsync();
            if (!currentUserId.HasValue)
                return Unauthorized("User not found.");

            // 6. Get user's branch ID (or from model if admin)
            int branchId;
            bool isAdmin = await IsUserAdminAsync();

            if (isAdmin && model.BranchId.HasValue && model.BranchId.Value > 0)
            {
                branchId = model.BranchId.Value;
            }
            else
            {
                var employeeBranch = await _context.Users
                    .Where(u => u.UserId == currentUserId.Value)
                    .Select(u => new { u.BranchId })
                    .FirstOrDefaultAsync();

                if (employeeBranch == null || !employeeBranch.BranchId.HasValue)
                    return BadRequest("Employee branch not found.");

                branchId = employeeBranch.BranchId.Value;
            }

            // 7. Update reorder
            var reorder = new Reorder
            {
                ReorderId = id,
                SupplierId = model.SupplierId.Value,
                ProductId = model.ProductId.Value,
                ReorderThershold = model.Threshold.Value,
                ReorderQuantity = model.Quantity.Value,
                UserId = currentUserId.Value,
                BranchId = branchId
            };

            var updated = await _repo.UpdateReorderAsync(reorder);

            if (updated == null)
                return NotFound("Reorder not found.");

            // 8. Log update
            var supplier = await _context.Suppliers.FindAsync(model.SupplierId.Value);
            var product = await _context.Products.FindAsync(model.ProductId.Value);
            var employeeDetails = await _context.Users.FindAsync(currentUserId.Value);

            var details = $"Supplier: {supplier?.SupplierName ?? "Unknown"}, " +
                          $"Product: {product?.ProductName ?? "Unknown"}, " +
                          $"Threshold: {model.Threshold.Value}, " +
                          $"Quantity: {model.Quantity.Value}, " +
                          $"Branch ID: {branchId}, " +
                          $"Employee: {employeeDetails?.FirstName} {employeeDetails?.LastName}";

            await _logger.CreateEditRecordLogAsync(
                userId: currentUserId.Value,
                tableName: "Reorder",
                recordId: id,
                details: details
            );

            return Ok(updated);
        }

        // =============================================================
        // DELETE: api/Reorder/{id}
        // =============================================================
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid reorder ID.");

            // Get reorder details before deletion for logging
            var reorderToDelete = await _context.Reorders
                .Include(r => r.Supplier)
                .Include(r => r.Product)
                .Include(r => r.User)
                .Include(r => r.Branch)
                    .ThenInclude(b => b.Address)
                        .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(r => r.ReorderId == id);

            if (reorderToDelete == null)
                return NotFound("Reorder not found.");

            var supplierName = reorderToDelete.Supplier?.SupplierName ?? "Unknown";
            var productName = reorderToDelete.Product?.ProductName ?? "Unknown";
            var threshold = reorderToDelete.ReorderThershold ?? 0;
            var quantity = reorderToDelete.ReorderQuantity ?? 0;
            var branchName = reorderToDelete.Branch?.Address?.City?.CityName ?? "Unknown";
            var employeeName = reorderToDelete.User != null
                ? $"{reorderToDelete.User.FirstName} {reorderToDelete.User.LastName}".Trim()
                : "Unknown";

            var currentUserId = await GetCurrentUserIdAsync();

            // Delete the reorder
            _context.Reorders.Remove(reorderToDelete);
            await _context.SaveChangesAsync();

            // Log deletion
            if (currentUserId.HasValue)
            {
                var details = $"Reorder ID: {id}, Supplier: {supplierName}, Product: {productName}, " +
                              $"Threshold: {threshold}, Quantity: {quantity}, Branch: {branchName}, Employee: {employeeName}";

                await _logger.CreateDeleteRecordLogAsync(
                    userId: currentUserId.Value,
                    tableName: "Reorder",
                    recordId: id,
                    details: details
                );
            }

            return Ok(new { deleted = true, message = "Reorder deleted successfully." });
        }
    }
}
