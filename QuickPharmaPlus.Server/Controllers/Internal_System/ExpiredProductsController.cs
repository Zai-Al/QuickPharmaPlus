using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Pharmacist,Manager")]
    public class ExpiredProductsController : ControllerBase
    {
        private readonly IInventoryRepository _repo;
        private readonly IQuickPharmaLogRepository _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly QuickPharmaPlusDbContext _context;

        public ExpiredProductsController(
            IInventoryRepository repo,
            IQuickPharmaLogRepository logger,
            UserManager<ApplicationUser> userManager,
            QuickPharmaPlusDbContext context)
        {
            _repo = repo;
            _logger = logger;
            _userManager = userManager;
            _context = context;
        }

        // GET: api/ExpiredProducts
        [HttpGet]
        public async Task<IActionResult> GetExpiredProducts(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] int daysBeforeExpiry = 29,
            [FromQuery] string? search = null,
            [FromQuery] string? supplierName = null,
            [FromQuery] DateOnly? expiryDate = null)
        {
            // Backend SAFE VALIDATION

            // Validate inventory ID search (must be numeric if numeric input)
            if (!string.IsNullOrWhiteSpace(search))
            {
                // Validate allowed characters for product search
                // Letters, numbers, spaces, + and -
                if (!Regex.IsMatch(search, @"^[A-Za-z0-9+\- ]*$"))
                {
                    ModelState.AddModelError("search", "Product search may only contain letters, numbers, spaces, + and -.");
                    return BadRequest(ModelState);
                }
            }

            // Validate supplier name search
            if (!string.IsNullOrWhiteSpace(supplierName))
            {
                if (!Regex.IsMatch(supplierName, @"^[A-Za-z0-9+\- ]*$"))
                {
                    ModelState.AddModelError("supplierName", "Supplier search may only contain letters, numbers, spaces, + and -.");
                    return BadRequest(ModelState);
                }
            }

            // Validate expiry date sent from UI
            if (expiryDate.HasValue)
            {
                if (expiryDate.Value.Year < 2000 || expiryDate.Value.Year > 2100)
                {
                    ModelState.AddModelError("expiryDate", "Invalid expiry date.");
                    return BadRequest(ModelState);
                }
            }

            var result = await _repo.GetExpiredInventoriesAsync(
                pageNumber, 
                pageSize, 
                daysBeforeExpiry, 
                search, 
                supplierName, 
                expiryDate);

            return Ok(new
            {
                items = result.Items,
                totalCount = result.TotalCount,
                pageNumber,
                pageSize
            });
        }

        // POST: api/ExpiredProducts/dispose/{id}
        [HttpPost("dispose/{id:int}")]
        public async Task<IActionResult> DisposeExpiredProduct(int id)
        {
            try
            {
                // =================== GET INVENTORY DETAILS BEFORE DISPOSAL ===================
                var inventoryToDispose = await _context.Inventories
                    .Include(i => i.Product)
                        .ThenInclude(p => p!.Supplier)
                    .Include(i => i.Product)
                        .ThenInclude(p => p!.Category)
                    .Include(i => i.Product)
                        .ThenInclude(p => p!.ProductType)
                    .Include(i => i.Branch)
                        .ThenInclude(b => b!.Address)
                            .ThenInclude(a => a!.City)
                    .FirstOrDefaultAsync(i => i.InventoryId == id);

                if (inventoryToDispose == null)
                    return NotFound(new { error = "Inventory record not found." });

                // Verify the product is actually expired or expiring soon
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var expiryThreshold = today.AddDays(29);

                if (!inventoryToDispose.InventoryExpiryDate.HasValue || 
                    inventoryToDispose.InventoryExpiryDate.Value > expiryThreshold)
                {
                    return BadRequest(new { error = "This inventory batch is not expiring within 29 days." });
                }

                var productName = inventoryToDispose.Product?.ProductName ?? "Unknown Product";
                var branchName = inventoryToDispose.Branch?.Address?.City?.CityName ?? "Unknown Branch";
                var supplierName = inventoryToDispose.Product?.Supplier?.SupplierName ?? "Unknown Supplier";
                var categoryName = inventoryToDispose.Product?.Category?.CategoryName ?? "Unknown Category";
                var productType = inventoryToDispose.Product?.ProductType?.ProductTypeName ?? "Unknown Type";
                var quantity = inventoryToDispose.InventoryQuantity ?? 0;
                var expiryDate = inventoryToDispose.InventoryExpiryDate;

                // =================== DELETE/DISPOSE INVENTORY ===================
                var success = await _repo.DeleteInventoryAsync(id);
                
                if (!success) 
                    return NotFound(new { error = "Failed to dispose inventory batch." });

                // =================== CREATE DETAILED LOG ===================
                var currentUserId = await GetCurrentUserIdAsync();
                if (currentUserId.HasValue)
                {
                    var details = $"Disposed Expired Inventory - Product: {productName}, Supplier: {supplierName}, Category: {categoryName}, Type: {productType}, Branch: {branchName}, Quantity: {quantity}, Expiry Date: {expiryDate}";

                    await _logger.CreateDeleteRecordLogAsync(
                        userId: currentUserId.Value,
                        tableName: "Inventory",
                        recordId: id,
                        details: details
                    );
                }

                return Ok(new { message = "Expired inventory batch disposed successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An unexpected error occurred.", details = ex.Message });
            }
        }

        // =================== HELPER METHOD ===================
        private async Task<int?> GetCurrentUserIdAsync()
        {
            var userEmail = User?.Identity?.Name;
            if (string.IsNullOrEmpty(userEmail))
                return null;

            var identityUser = await _userManager.FindByEmailAsync(userEmail);
            if (identityUser == null)
                return null;

            var domainUser = await _context.Users
                .FirstOrDefaultAsync(u => u.IdentityUserId == identityUser.Id);

            return domainUser?.UserId;
        }
    }
}