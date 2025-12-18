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
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryRepository _repo;
        private readonly IQuickPharmaLogRepository _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly QuickPharmaPlusDbContext _context;

        public InventoryController(
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

        // GET: api/Inventory
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] DateOnly? expiryDate = null)
        {
            // Backend SAFE VALIDATION

            // Validate inventory ID search (must be numeric if numeric input)
            if (!string.IsNullOrWhiteSpace(search))
            {
                // If user is searching by number ensure numeric
                if (search.All(char.IsDigit) == false && Regex.IsMatch(search, @"^\d+$"))
                {
                    ModelState.AddModelError("search", "Inventory ID must contain numbers only.");
                    return BadRequest(ModelState);
                }

                // Validate allowed characters for product search
                // Letters, numbers, spaces, + and -
                if (!Regex.IsMatch(search, @"^[A-Za-z0-9+\- ]*$"))
                {
                    ModelState.AddModelError("search", "Product search may only contain letters, numbers, spaces, + and -.");
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

            var result = await _repo.GetAllInventoriesAsync(pageNumber, pageSize, search, expiryDate);

            return Ok(new
            {
                items = result.Items,
                totalCount = result.TotalCount,
                pageNumber,
                pageSize
            });
        }

        // GET: api/Inventory/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var inv = await _repo.GetInventoryByIdAsync(id);
            if (inv == null) return NotFound();
            return Ok(inv);
        }

        // POST: api/Inventory
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Inventory payload)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // =================== VALIDATION ===================
            
            // Product ID
            if (!payload.ProductId.HasValue || payload.ProductId.Value <= 0)
                return BadRequest("Product must be selected.");

            // Branch ID
            if (!payload.BranchId.HasValue || payload.BranchId.Value <= 0)
                return BadRequest("Branch must be selected.");

            // Quantity
            if (!payload.InventoryQuantity.HasValue || payload.InventoryQuantity.Value <= 0)
                return BadRequest("Quantity must be a positive integer greater than 0.");

            // Expiry Date
            if (!payload.InventoryExpiryDate.HasValue)
                return BadRequest("Batch expiry date is required.");

            // Validate expiry date is in the future
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (payload.InventoryExpiryDate.Value < today)
                return BadRequest("Expiry date must be in the future.");

            // Verify product exists
            var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == payload.ProductId.Value);
            if (product == null)
                return BadRequest("Selected product does not exist.");

            // Verify branch exists
            var branch = await _context.Branches
                .Include(b => b.Address)
                    .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(b => b.BranchId == payload.BranchId.Value);
            if (branch == null)
                return BadRequest("Selected branch does not exist.");

            try
            {
                // =================== CREATE INVENTORY ===================
                var created = await _repo.AddInventoryAsync(payload);

                // =================== CREATE DETAILED LOG ===================
                var currentUserId = await GetCurrentUserIdAsync();
                if (currentUserId.HasValue)
                {
                    var productName = product.ProductName ?? "Unknown Product";
                    var branchName = branch.Address?.City?.CityName ?? "Unknown Branch";
                    var details = $"Product: {productName}, Branch: {branchName}, Quantity: {payload.InventoryQuantity}, Expiry Date: {payload.InventoryExpiryDate}";

                    await _logger.CreateAddRecordLogAsync(
                        userId: currentUserId.Value,
                        tableName: "Inventory",
                        recordId: created.InventoryId,
                        details: details
                    );
                }

                return Ok(new
                {
                    inventoryId = created.InventoryId,
                    message = "Inventory record added successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An unexpected error occurred.", details = ex.Message });
            }
        }

        // PUT: api/Inventory/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Inventory payload)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // =================== VALIDATION ===================
            
            // Product ID
            if (!payload.ProductId.HasValue || payload.ProductId.Value <= 0)
                return BadRequest("Product must be selected.");

            // Branch ID
            if (!payload.BranchId.HasValue || payload.BranchId.Value <= 0)
                return BadRequest("Branch must be selected.");

            // Quantity
            if (!payload.InventoryQuantity.HasValue || payload.InventoryQuantity.Value <= 0)
                return BadRequest("Quantity must be a positive integer greater than 0.");

            // Expiry Date
            if (!payload.InventoryExpiryDate.HasValue)
                return BadRequest("Batch expiry date is required.");

            // Validate expiry date is in the future
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (payload.InventoryExpiryDate.Value < today)
                return BadRequest("Expiry date must be in the future.");

            try
            {
                // =================== GET EXISTING INVENTORY ===================
                var existingInventory = await _context.Inventories
                    .Include(i => i.Product)
                    .Include(i => i.Branch)
                        .ThenInclude(b => b.Address)
                            .ThenInclude(a => a.City)
                    .FirstOrDefaultAsync(i => i.InventoryId == id);

                if (existingInventory == null)
                    return NotFound("Inventory record not found.");

                // =================== TRACK CHANGES ===================
                var changes = new List<string>();

                var oldProductName = existingInventory.Product?.ProductName ?? "Unknown";
                var oldBranchName = existingInventory.Branch?.Address?.City?.CityName ?? "Unknown";
                var oldQuantity = existingInventory.InventoryQuantity ?? 0;
                var oldExpiryDate = existingInventory.InventoryExpiryDate;

                // Get new product and branch names
                var newProduct = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == payload.ProductId.Value);
                var newBranch = await _context.Branches
                    .Include(b => b.Address)
                        .ThenInclude(a => a.City)
                    .FirstOrDefaultAsync(b => b.BranchId == payload.BranchId.Value);

                if (newProduct == null)
                    return BadRequest("Selected product does not exist.");
                if (newBranch == null)
                    return BadRequest("Selected branch does not exist.");

                var newProductName = newProduct.ProductName ?? "Unknown";
                var newBranchName = newBranch.Address?.City?.CityName ?? "Unknown";

                if (existingInventory.ProductId != payload.ProductId.Value)
                    changes.Add($"Product: '{oldProductName}' → '{newProductName}'");

                if (existingInventory.BranchId != payload.BranchId.Value)
                    changes.Add($"Branch: '{oldBranchName}' → '{newBranchName}'");

                if (existingInventory.InventoryQuantity != payload.InventoryQuantity.Value)
                    changes.Add($"Quantity: {oldQuantity} → {payload.InventoryQuantity.Value}");

                if (existingInventory.InventoryExpiryDate != payload.InventoryExpiryDate.Value)
                    changes.Add($"Expiry Date: {oldExpiryDate} → {payload.InventoryExpiryDate.Value}");

                // =================== UPDATE INVENTORY ===================
                payload.InventoryId = id;
                var updated = await _repo.UpdateInventoryAsync(payload);
                
                if (updated == null) 
                    return NotFound("Failed to update inventory record.");

                // =================== CREATE DETAILED LOG ===================
                var currentUserId = await GetCurrentUserIdAsync();
                if (currentUserId.HasValue && changes.Any())
                {
                    var details = $"Inventory ID: {id}, Product: {newProductName}, Branch: {newBranchName} - Changes: {string.Join(", ", changes)}";

                    await _logger.CreateEditRecordLogAsync(
                        userId: currentUserId.Value,
                        tableName: "Inventory",
                        recordId: id,
                        details: details
                    );
                }

                return Ok(new { message = "Inventory record updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An unexpected error occurred.", details = ex.Message });
            }
        }

        // DELETE: api/Inventory/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                // =================== GET INVENTORY DETAILS BEFORE DELETION ===================
                var inventoryToDelete = await _context.Inventories
                    .Include(i => i.Product)
                    .Include(i => i.Branch)
                        .ThenInclude(b => b.Address)
                            .ThenInclude(a => a.City)
                    .FirstOrDefaultAsync(i => i.InventoryId == id);

                if (inventoryToDelete == null)
                    return NotFound(new { error = "Inventory record not found." });

                var productName = inventoryToDelete.Product?.ProductName ?? "Unknown Product";
                var branchName = inventoryToDelete.Branch?.Address?.City?.CityName ?? "Unknown Branch";
                var quantity = inventoryToDelete.InventoryQuantity ?? 0;
                var expiryDate = inventoryToDelete.InventoryExpiryDate;

                // =================== DELETE INVENTORY ===================
                var success = await _repo.DeleteInventoryAsync(id);
                
                if (!success) 
                    return NotFound(new { error = "Failed to delete inventory record." });

                // =================== CREATE DETAILED LOG ===================
                var currentUserId = await GetCurrentUserIdAsync();
                if (currentUserId.HasValue)
                {
                    var details = $"Deleted Inventory - Product: {productName}, Branch: {branchName}, Quantity: {quantity}, Expiry Date: {expiryDate}";

                    await _logger.CreateDeleteRecordLogAsync(
                        userId: currentUserId.Value,
                        tableName: "Inventory",
                        recordId: id,
                        details: details
                    );
                }

                return Ok(new { message = "Inventory record deleted successfully." });
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
