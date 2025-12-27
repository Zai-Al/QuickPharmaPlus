using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Product;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Pharmacist,Manager")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepository _repo;
        private readonly IQuickPharmaLogRepository _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly QuickPharmaPlusDbContext _context;

        // === REGEX MATCH FRONT-END VALIDATION ===
        private static readonly Regex NamePattern = new(@"^[A-Za-z0-9 .,+\-&/%/]*$");
        private static readonly Regex SupplierPattern = new(@"^[A-Za-z\s-]*$");
        private static readonly Regex CategoryPattern = new(@"^[A-Za-z\s]*$");
        private static readonly Regex IdPattern = new(@"^[0-9]*$");

        private const string ProductNameRulesMessage =
            "Product name may only contain letters, numbers, spaces, dots, commas, dashes, plus signs, ampersands (&), slashes (/), and percent signs (%).";

        // ================================
        // SINGLE CONSTRUCTOR - DO NOT DUPLICATE
        // ================================
        public ProductsController(
            IProductRepository repo,
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

        // GET: api/Products?pageNumber=1&pageSize=10&search=...
        [HttpGet]
        public async Task<IActionResult> GetAll(int pageNumber = 1, int pageSize = 10, string? search = null, int? supplierId = null, int? categoryId = null)
        {
            // === BACKEND VALIDATION (matches React rules) ===

            if (pageNumber <= 0 || pageSize <= 0)
                return BadRequest("Page number and page size must be positive.");

            // Validate search text
            if (!string.IsNullOrWhiteSpace(search))
            {
                // search may contain name or ID → validate both possibilities
                bool validName = NamePattern.IsMatch(search);
                bool validId = IdPattern.IsMatch(search);

                if (!validName && !validId)
                    return BadRequest("Search contains invalid characters.");
            }

            // Validate supplierId
            if (supplierId.HasValue && supplierId.Value <= 0)
                return BadRequest("SupplierId must be a positive integer.");

            // Validate categoryId
            if (categoryId.HasValue && categoryId.Value <= 0)
                return BadRequest("CategoryId must be a positive integer.");

            var result = await _repo.GetAllProductsAsync(pageNumber, pageSize, search, supplierId, categoryId);
            return Ok(result);
        }

        // GET api/Products/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid product ID.");

            var dto = await _repo.GetProductByIdAsync(id);
            if (dto == null) return NotFound();
            return Ok(dto);
        }

        // =====================================================
        // CHECK IF PRODUCT NAME EXISTS (FOR REAL-TIME VALIDATION)
        // =====================================================
        [HttpGet("check-name")]
        public async Task<IActionResult> CheckProductName(
            [FromQuery] string name,
            [FromQuery] int? excludeId = null)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest("Product name is required.");

            var exists = await _repo.ProductNameExistsAsync(name.Trim(), excludeId);

            return Ok(new { exists });
        }

        // POST api/Products
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] ProductCreateDto model)
        {
            // 1. Validate name is not empty
            if (string.IsNullOrWhiteSpace(model.ProductName))
                return BadRequest("Product name is required.");

            var trimmedName = model.ProductName.Trim();

            // 2. Validate minimum length
            if (trimmedName.Length < 3)
                return BadRequest("Product name must be at least 3 characters.");

            // 3. Validate allowed characters FIRST (before duplicate check)
            if (!NamePattern.IsMatch(trimmedName))
                return BadRequest(ProductNameRulesMessage);

            // 4. Check for duplicate name (AFTER character validation passes)
            var nameExists = await _repo.ProductNameExistsAsync(trimmedName);
            if (nameExists)
                return Conflict("A product with this name already exists in the system.");

            // 5. Validate description
            if (string.IsNullOrWhiteSpace(model.ProductDescription))
                return BadRequest("Product description is required.");

            if (model.ProductDescription.Trim().Length < 3)
                return BadRequest("Product description must be at least 3 characters.");

            // 6. Validate supplier
            if (!model.SupplierId.HasValue || model.SupplierId.Value <= 0)
                return BadRequest("Valid supplier must be selected.");

            // 7. Validate category
            if (!model.CategoryId.HasValue || model.CategoryId.Value <= 0)
                return BadRequest("Valid category must be selected.");

            // 8. Validate product type
            if (!model.ProductTypeId.HasValue || model.ProductTypeId.Value <= 0)
                return BadRequest("Valid product type must be selected.");

            // 9. Validate price
            if (!model.ProductPrice.HasValue || model.ProductPrice.Value <= 0)
                return BadRequest("Product price must be greater than 0.");


            // KEEP the invalid-id check, but only when IngredientIds is provided:
            if (model.IngredientIds != null && model.IngredientIds.Any(id => id <= 0))
                return BadRequest("Invalid ingredient ID detected.");

            // 11. Process image
            byte[]? imageBytes = null;
            string? imageFileName = null;

            if (model.ProductImage != null)
            {
                using var ms = new MemoryStream();
                await model.ProductImage.CopyToAsync(ms);
                imageBytes = ms.ToArray();
                imageFileName = model.ProductImage.FileName;
            }

            // 12. Create product
            var product = new Product
            {
                ProductName = trimmedName,
                ProductDescription = model.ProductDescription.Trim(),
                SupplierId = model.SupplierId.Value,
                CategoryId = model.CategoryId.Value,
                ProductTypeId = model.ProductTypeId.Value,
                ProductPrice = model.ProductPrice.Value,
                IsControlled = model.IsControlled,
                ProductImage = imageBytes,
                IsActive = true // SET AS ACTIVE BY DEFAULT
            };

            var created = await _repo.AddProductAsync(product);

            // 13. NEW: Create ingredient-product relationships
            // Guard for null:
            if (model.IngredientIds != null)
            {
                foreach (var ingredientId in model.IngredientIds)
                {
                    var ingredientProduct = new IngredientProduct
                    {
                        ProductId = created.ProductId,
                        IngredientId = ingredientId
                    };

                    _context.IngredientProducts.Add(ingredientProduct);
                }

                await _context.SaveChangesAsync();
            }

            // =================== CREATE DETAILED LOG ===================
            var currentUserId = await GetCurrentUserIdAsync();
            if (currentUserId.HasValue)
            {
                // Get related entity names for better log details
                var supplier = await _context.Suppliers.FindAsync(model.SupplierId.Value);
                var category = await _context.Categories.FindAsync(model.CategoryId.Value);
                var productType = await _context.ProductTypes.FindAsync(model.ProductTypeId.Value);

                // Logging: only query ingredient names when IngredientIds provided
                var ingredientNames = new List<string>();
                if (model.IngredientIds != null && model.IngredientIds.Count > 0)
                {
                    ingredientNames = await _context.Ingredients
                        .Where(i => model.IngredientIds.Contains(i.IngredientId))
                        .Select(i => i.IngredientName)
                        .ToListAsync();
                }

                var details = $"Product Name: {trimmedName}, " +
                              $"Price: BHD {model.ProductPrice.Value:F3}, " +
                              $"Supplier: {supplier?.SupplierName ?? "Unknown"}, " +
                              $"Category: {category?.CategoryName ?? "Unknown"}, " +
                              $"Type: {productType?.ProductTypeName ?? "Unknown"}, " +
                              $"Controlled: {(model.IsControlled ? "Yes" : "No")}, " +
                              $"Ingredients: [{string.Join(", ", ingredientNames)}]";

                if (!string.IsNullOrWhiteSpace(imageFileName))
                {
                    details += $", Image: {imageFileName}";
                }

                await _logger.CreateAddRecordLogAsync(
                    userId: currentUserId.Value,
                    tableName: "Product",
                    recordId: created.ProductId,
                    details: details
                );
            }

            return Ok(new
            {
                message = "Product created successfully.",
                product = created
            });
        }

        // PUT api/Products/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromForm] ProductCreateDto model)
        {
            if (id <= 0)
                return BadRequest("Invalid product ID.");

            // 1. Check if product exists AND IS ACTIVE
            var existingProduct = await _context.Products
                .Include(p => p.Supplier)
                .Include(p => p.Category)
                .Include(p => p.ProductType)
                .FirstOrDefaultAsync(p => p.ProductId == id && p.IsActive);

            if (existingProduct == null)
                return NotFound("Product not found.");

            // Get existing ingredients for comparison
            var existingIngredients = await _context.IngredientProducts
                .Where(ip => ip.ProductId == id)
                .Include(ip => ip.Ingredient)
                .ToListAsync();

            // 2. Validate name is not empty
            if (string.IsNullOrWhiteSpace(model.ProductName))
                return BadRequest("Product name is required.");

            var trimmedName = model.ProductName.Trim();

            // 3. Validate minimum length
            if (trimmedName.Length < 3)
                return BadRequest("Product name must be at least 3 characters.");

            // 4. Validate allowed characters
            if (!NamePattern.IsMatch(trimmedName))
                return BadRequest("Product name may only contain letters, numbers, spaces, dots, dashes, and plus signs.");

            // 5. Check for duplicate name (excluding current product)
            var nameExists = await _repo.ProductNameExistsAsync(trimmedName, id);
            if (nameExists)
                return Conflict("A product with this name already exists in the system.");

            // 6. Validate description
            if (string.IsNullOrWhiteSpace(model.ProductDescription))
                return BadRequest("Product description is required.");

            if (model.ProductDescription.Trim().Length < 3)
                return BadRequest("Product description must be at least 3 characters.");

            // 7. Validate supplier
            if (!model.SupplierId.HasValue || model.SupplierId.Value <= 0)
                return BadRequest("Valid supplier must be selected.");

            // 8. Validate category
            if (!model.CategoryId.HasValue || model.CategoryId.Value <= 0)
                return BadRequest("Valid category must be selected.");

            // 9. Validate product type
            if (!model.ProductTypeId.HasValue || model.ProductTypeId.Value <= 0)
                return BadRequest("Valid product type must be selected.");

            // 10. Validate price
            if (!model.ProductPrice.HasValue || model.ProductPrice.Value <= 0)
                return BadRequest("Product price must be greater than 0.");

            // 11. Validate ingredients
            // REMOVE this block:
            // if (model.IngredientIds == null || model.IngredientIds.Count == 0)
            //     return BadRequest("At least one active ingredient must be selected.");

            // Validate IDs only when provided:
            if (model.IngredientIds != null && model.IngredientIds.Any(ingredientId => ingredientId <= 0))
                return BadRequest("Invalid ingredient ID detected.");

            // =================== TRACK CHANGES ===================
            var changes = new List<string>();

            // Track name change
            if (existingProduct.ProductName != trimmedName)
                changes.Add($"Name: '{existingProduct.ProductName}' → '{trimmedName}'");

            // Track description change
            if (existingProduct.ProductDescription != model.ProductDescription.Trim())
                changes.Add($"Description updated");

            // Track price change
            if (existingProduct.ProductPrice != model.ProductPrice.Value)
                changes.Add($"Price: BHD {existingProduct.ProductPrice:F3} → BHD {model.ProductPrice.Value:F3}");

            // Track supplier change
            if (existingProduct.SupplierId != model.SupplierId.Value)
            {
                var newSupplier = await _context.Suppliers.FindAsync(model.SupplierId.Value);
                changes.Add($"Supplier: '{existingProduct.Supplier?.SupplierName ?? "Unknown"}' → '{newSupplier?.SupplierName ?? "Unknown"}'");
            }

            // Track category change
            if (existingProduct.CategoryId != model.CategoryId.Value)
            {
                var newCategory = await _context.Categories.FindAsync(model.CategoryId.Value);
                changes.Add($"Category: '{existingProduct.Category?.CategoryName ?? "Unknown"}' → '{newCategory?.CategoryName ?? "Unknown"}'");
            }

            // Track product type change
            if (existingProduct.ProductTypeId != model.ProductTypeId.Value)
            {
                var newType = await _context.ProductTypes.FindAsync(model.ProductTypeId.Value);
                changes.Add($"Type: '{existingProduct.ProductType?.ProductTypeName ?? "Unknown"}' → '{newType?.ProductTypeName ?? "Unknown"}'");
            }

            // Track controlled status change
            if (existingProduct.IsControlled != model.IsControlled)
                changes.Add($"Controlled: {(existingProduct.IsControlled ?? false ? "Yes" : "No")} → {(model.IsControlled ? "Yes" : "No")}");

            // Track ingredient changes
            var oldIngredientIds = existingIngredients.Select(ei => ei.IngredientId ?? 0).OrderBy(x => x).ToList();
            var newIngredientIds = (model.IngredientIds ?? new List<int>()).OrderBy(x => x).ToList();

            if (!oldIngredientIds.SequenceEqual(newIngredientIds))
            {
                var oldIngredientNames = existingIngredients
                    .Where(ei => ei.Ingredient != null)
                    .Select(ei => ei.Ingredient!.IngredientName)
                    .ToList();

                var newIngredientNames = new List<string>();
                if (model.IngredientIds != null && model.IngredientIds.Count > 0)
                {
                    newIngredientNames = await _context.Ingredients
                        .Where(i => model.IngredientIds.Contains(i.IngredientId))
                        .Select(i => i.IngredientName)
                        .ToListAsync();
                }

                changes.Add($"Ingredients: [{string.Join(", ", oldIngredientNames)}] → [{string.Join(", ", newIngredientNames)}]");
            }

            // 12. Update product fields
            existingProduct.ProductName = trimmedName;
            existingProduct.ProductDescription = model.ProductDescription.Trim();
            existingProduct.SupplierId = model.SupplierId.Value;
            existingProduct.CategoryId = model.CategoryId.Value;
            existingProduct.ProductTypeId = model.ProductTypeId.Value;
            existingProduct.ProductPrice = model.ProductPrice.Value;
            existingProduct.IsControlled = model.IsControlled;

            // 13. Process image only if new one is uploaded
            string? imageFileName = null;
            if (model.ProductImage != null)
            {
                using var ms = new MemoryStream();
                await model.ProductImage.CopyToAsync(ms);
                existingProduct.ProductImage = ms.ToArray();
                imageFileName = model.ProductImage.FileName;

                // Track image change
                changes.Add($"Image Updated: {imageFileName}");
            }

            // 14. Update ingredient relationships
            // Remove existing relationships
            _context.IngredientProducts.RemoveRange(existingIngredients);

            if (model.IngredientIds != null)
            {
                foreach (var ingredientId in model.IngredientIds)
                {
                    _context.IngredientProducts.Add(new IngredientProduct
                    {
                        ProductId = id,
                        IngredientId = ingredientId
                    });
                }
            }

            await _context.SaveChangesAsync();

            // =================== CREATE DETAILED LOG ===================
            var currentUserId = await GetCurrentUserIdAsync();
            if (currentUserId.HasValue && changes.Any())
            {
                var details = $"Product: {trimmedName} - Changes: {string.Join(", ", changes)}";

                await _logger.CreateEditRecordLogAsync(
                    userId: currentUserId.Value,
                    tableName: "Product",
                    recordId: id,
                    details: details
                );
            }

            return Ok(new
            {   
                message = "Product updated successfully.",
                product = existingProduct
            });
        }
               
        // GET api/Products/{id}/inventory-count
        [HttpGet("{id:int}/inventory-count")]
        public async Task<IActionResult> GetInventoryCount(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid product ID.");

            var inventoryCount = await _context.Inventories
                .Where(i => i.ProductId == id && i.InventoryQuantity.HasValue && i.InventoryQuantity.Value > 0)
                .SumAsync(i => (int?)i.InventoryQuantity) ?? 0;

            return Ok(new { inventoryCount });
        }

        // DELETE api/Products/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid product ID.");

            // =================== GET PRODUCT DETAILS BEFORE SOFT DELETION ===================
            var productToDelete = await _context.Products
                .Include(p => p.Supplier)
                .Include(p => p.Category)
                .Include(p => p.ProductType)
                .FirstOrDefaultAsync(p => p.ProductId == id && p.IsActive);

            if (productToDelete == null)
                return NotFound("Product not found.");

            string deletedProductName = productToDelete.ProductName ?? "Unknown";
            string supplierName = productToDelete.Supplier?.SupplierName ?? "Unknown";
            string categoryName = productToDelete.Category?.CategoryName ?? "Unknown";
            decimal? price = productToDelete.ProductPrice;

            // Get ingredient names
            var ingredientNames = await _context.IngredientProducts
                .Where(ip => ip.ProductId == id)
                .Include(ip => ip.Ingredient)
                .Select(ip => ip.Ingredient!.IngredientName)
                .ToListAsync();

            var currentUserId = await GetCurrentUserIdAsync();

            var success = await _repo.DeleteProductAsync(id);
            if (!success) return NotFound();

            // =================== CREATE DETAILED LOG ===================
            if (currentUserId.HasValue)
            {
                var details = $"Product: {deletedProductName}, " +
                              $"Price: BHD {price:F3}, " +
                              $"Supplier: {supplierName}, " +
                              $"Category: {categoryName}, " +
                              $"Ingredients: [{string.Join(", ", ingredientNames)}] " +
                              $"(Soft deleted - marked as inactive)";

                await _logger.CreateDeleteRecordLogAsync(
                    userId: currentUserId.Value,
                    tableName: "Product",
                    recordId: id,
                    details: details
                );
            }

            return Ok(new { deleted = true });
        }

        // GET api/Products/{id}/details
        [HttpGet("{id:int}/details")]
        public async Task<IActionResult> GetProductDetailsWithInteractions(int id)
        {
            try
            {
                if (id <= 0)
                    return BadRequest("Invalid product ID.");

                // Get basic product details - ONLY ACTIVE PRODUCTS
                var product = await _context.Products
                    .Where(p => p.IsActive)
                    .Include(p => p.Category)
                    .Include(p => p.ProductType)
                    .Include(p => p.Supplier)
                    .FirstOrDefaultAsync(p => p.ProductId == id);

                if (product == null)
                    return NotFound("Product not found.");

                var dto = new ProductDetailWithInteractionsDto
                {
                    ProductId = product.ProductId,
                    ProductName = product.ProductName,
                    ProductDescription = product.ProductDescription,
                    ProductPrice = product.ProductPrice,
                    IsControlled = product.IsControlled,
                    SupplierId = product.SupplierId,
                    SupplierName = product.Supplier?.SupplierName,
                    ProductTypeId = product.ProductTypeId,
                    ProductTypeName = product.ProductType?.ProductTypeName,
                    CategoryId = product.CategoryId ?? 0,
                    CategoryName = product.Category?.CategoryName,
                    ProductImage = product.ProductImage
                };

                // Fetch ingredients for this product from IngredientProduct junction table
                var ingredients = await _context.IngredientProducts
                    .Where(ip => ip.ProductId == id && ip.IngredientId.HasValue)
                    .Include(ip => ip.Ingredient)
                    .Select(ip => new IngredientDto
                    {
                        IngredientId = ip.Ingredient!.IngredientId,
                        IngredientName = ip.Ingredient.IngredientName
                    })
                    .ToListAsync();

                dto.Ingredients = ingredients ?? new List<IngredientDto>();

                // Fetch interactions for these ingredients
                var ingredientIds = ingredients.Select(i => i.IngredientId).ToList();

                if (ingredientIds.Any())
                {
                    // Search for interactions where ANY of the product's ingredients 
                    // appear as either IngredientA or IngredientB
                    var interactions = await _context.Interactions
                        .Include(i => i.IngredientA)
                        .Include(i => i.IngredientB)
                        .Include(i => i.InteractionType)
                        .Where(i =>
                            (i.IngredientAId.HasValue && ingredientIds.Contains(i.IngredientAId.Value)) ||
                            (i.IngredientBId.HasValue && ingredientIds.Contains(i.IngredientBId.Value))
                        )
                        .ToListAsync();

                    dto.KnownInteractions = interactions.Select(i => new ProductInteractionDto
                    {
                        IngredientAName = i.IngredientA?.IngredientName ?? "Unknown",
                        IngredientBName = i.IngredientB?.IngredientName ?? "Unknown",
                        InteractionTypeName = i.InteractionType?.InteractionTypeName ?? "Unknown Type",
                        InteractionDescription = i.InteractionDescription ?? "No description available"
                    }).ToList();
                }
                else
                {
                    dto.KnownInteractions = new List<ProductInteractionDto>();
                }

                return Ok(dto);
            }
            catch (Exception ex)
            {
                // Log the exception here
                return StatusCode(500, new { message = "An error occurred while fetching product details.", error = ex.Message });
            }
        }
    }
}