using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        private readonly QuickPharmaPlusDbContext _context;

        // === REGEX MATCH FRONT-END VALIDATION ===
        private static readonly Regex NamePattern = new(@"^[A-Za-z0-9 .\-+]*$");
        private static readonly Regex SupplierPattern = new(@"^[A-Za-z\s-]*$");
        private static readonly Regex CategoryPattern = new(@"^[A-Za-z\s]*$");
        private static readonly Regex IdPattern = new(@"^[0-9]*$");

        public ProductsController(IProductRepository repo, QuickPharmaPlusDbContext context)
        {
            _repo = repo;
            _context = context;
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
                return BadRequest("Product name may only contain letters, numbers, spaces, dots, dashes, and plus signs.");

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

            // 10. NEW: Validate ingredients - at least one must be selected
            if (model.IngredientIds == null || model.IngredientIds.Count == 0)
                return BadRequest("At least one active ingredient must be selected.");

            // Validate all ingredient IDs are positive
            if (model.IngredientIds.Any(id => id <= 0))
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
                ProductImage = imageBytes
            };

            var created = await _repo.AddProductAsync(product);

            // 13. NEW: Create ingredient-product relationships
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

            return Ok(new
            {
                message = "Product created successfully.",
                product = created
            });
        }

        // PUT api/Products/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Product model)
        {
            if (model == null || model.ProductId != id)
                return BadRequest("Product ID mismatch.");

            // Validate Product Name
            if (!string.IsNullOrWhiteSpace(model.ProductName) &&
                !NamePattern.IsMatch(model.ProductName))
                return BadRequest("Product name contains invalid characters.");

            var updated = await _repo.UpdateProductAsync(model);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        // DELETE api/Products/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid product ID.");

            var success = await _repo.DeleteProductAsync(id);
            if (!success) return NotFound();
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

                // Get basic product details
                var product = await _context.Products
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
                    ProductImage = product.ProductImage // NULL is fine here
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