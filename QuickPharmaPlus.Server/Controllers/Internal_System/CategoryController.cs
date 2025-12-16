using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Category;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoryController(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        // ================================
        // VALIDATION PATTERNS (same as UI)
        // ================================
        private static readonly Regex ValidNamePattern = new(@"^[A-Za-z\s\-'\.]*$");
        private static readonly Regex ValidIdPattern = new(@"^[0-9]*$");

        // =====================================================
        // FETCH PAGED + FILTERED CATEGORY LIST
        // =====================================================

        [HttpGet]
        public async Task<IActionResult> GetAllCategories(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null)
        {
            // -------------------------
            // APPLY VALIDATION
            // -------------------------

            if (!string.IsNullOrWhiteSpace(search))
            {
                var trimmed = search.Trim();

                // If numeric → must match ID pattern
                if (int.TryParse(trimmed, out _))
                {
                    if (!ValidIdPattern.IsMatch(trimmed))
                        return BadRequest("Category ID must contain only numbers.");
                }
                else
                {
                    // Otherwise validate as name
                    if (!ValidNamePattern.IsMatch(trimmed))
                        return BadRequest("Category name may only contain letters, spaces, dash (-), dot (.), and apostrophe (').");
                }
            }

            var result = await _categoryRepository.GetAllCategoriesAsync(pageNumber, pageSize, search);

            return Ok(new
            {
                items = result.Items,
                totalCount = result.TotalCount,
                pageNumber,
                pageSize
            });
        }

        // =====================================================
        // GET CATEGORY DETAILS BY ID
        // =====================================================
        [Authorize]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategoryById(int id)
        {
            // Validate ID
            if (id <= 0)
                return BadRequest("Invalid category ID.");

            var category = await _categoryRepository.GetCategoryByIdAsync(id);

            if (category == null)
                return NotFound("Category not found.");

            return Ok(category);
        }

        // =====================================================
        // CHECK IF CATEGORY NAME EXISTS (FOR REAL-TIME VALIDATION)
        // =====================================================
        [HttpGet("check-name")]
        public async Task<IActionResult> CheckCategoryName(
            [FromQuery] string name,
            [FromQuery] int? excludeId = null)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest("Category name is required.");

            var exists = await _categoryRepository.CategoryNameExistsAsync(name.Trim(), excludeId);

            return Ok(new { exists });
        }

        // =====================================================
        // CHECK IF TYPE NAME EXISTS (FOR REAL-TIME VALIDATION)
        // =====================================================
        [HttpGet("type/check-name")]
        public async Task<IActionResult> CheckTypeName(
            [FromQuery] string name,
            [FromQuery] int categoryId,
            [FromQuery] int? excludeTypeId = null)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest("Type name is required.");

            if (categoryId <= 0)
                return BadRequest("Valid category ID is required.");

            var exists = await _categoryRepository.TypeNameExistsAsync(name.Trim(), categoryId, excludeTypeId);

            return Ok(new { exists });
        }

        // =====================================================
        // CREATE CATEGORY
        // =====================================================
        [Authorize(Roles = "Admin")]
        [HttpPost("add")]
        public async Task<IActionResult> AddCategory([FromForm] CategoryCreateDto model)
        {
            // 1. Validate name is not empty
            if (string.IsNullOrWhiteSpace(model.CategoryName))
                return BadRequest("Category name is required.");

            var trimmedName = model.CategoryName.Trim();

            // 2. Validate minimum length
            if (trimmedName.Length < 3)
                return BadRequest("Category name must be at least 3 characters.");

            // 3. Validate allowed characters FIRST (before duplicate check)
            if (!ValidNamePattern.IsMatch(trimmedName))
                return BadRequest("Category name may only contain letters, spaces, dash (-), dot (.), and apostrophe (').");

            // 4. Check for duplicate name (AFTER character validation passes)
            var nameExists = await _categoryRepository.CategoryNameExistsAsync(trimmedName);
            if (nameExists)
                return Conflict("A category with this name already exists in the system.");

            // 5. Process image
            byte[]? imageBytes = null;

            if (model.CategoryImage != null)
            {
                using var ms = new MemoryStream();
                await model.CategoryImage.CopyToAsync(ms);
                imageBytes = ms.ToArray();
            }

            // 6. Create category
            var category = new Category
            {
                CategoryName = trimmedName,
                CategoryImage = imageBytes
            };

            var created = await _categoryRepository.AddCategoryAsync(category);

            return Ok(new
            {
                message = "Category created successfully.",
                category = created
            });
        }

        // =====================================================
        // UPDATE CATEGORY
        // =====================================================
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromForm] CategoryCreateDto model)
        {
            // 1. Validate ID
            if (id <= 0)
                return BadRequest("Invalid category ID.");

            // 2. Validate name is not empty
            if (string.IsNullOrWhiteSpace(model.CategoryName))
                return BadRequest("Category name is required.");

            var trimmedName = model.CategoryName.Trim();

            // 3. Validate minimum length
            if (trimmedName.Length < 3)
                return BadRequest("Category name must be at least 3 characters.");

            // 4. Validate allowed characters FIRST (before duplicate check)
            if (!ValidNamePattern.IsMatch(trimmedName))
                return BadRequest("Category name may only contain letters, spaces, dash (-), dot (.), and apostrophe (').");

            // 5. Check for duplicate name (excluding current category)
            var nameExists = await _categoryRepository.CategoryNameExistsAsync(trimmedName, id);
            if (nameExists)
                return Conflict("A category with this name already exists in the system.");

            // 6. Process image
            byte[]? imageBytes = null;

            if (model.CategoryImage != null)
            {
                using var ms = new MemoryStream();
                await model.CategoryImage.CopyToAsync(ms);
                imageBytes = ms.ToArray();
            }

            // 7. Update category
            var updated = new Category
            {
                CategoryId = id,
                CategoryName = trimmedName,
                CategoryImage = imageBytes
            };

            var result = await _categoryRepository.UpdateCategoryAsync(updated);

            if (result == null)
                return NotFound("Category not found.");

            return Ok(result);
        }

        // =====================================================
        // DELETE CATEGORY
        // =====================================================
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid category ID.");

            var deleted = await _categoryRepository.DeleteCategoryAsync(id);

            if (!deleted)
                return NotFound("Category not found or could not be deleted.");

            return Ok("Category deleted successfully.");
        }

        // =====================================================
        // GET PAGED PRODUCT TYPES FOR CATEGORY
        // =====================================================
        [HttpGet("types/{categoryId}")]
        public async Task<IActionResult> GetTypes(
            int categoryId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 5)
        {
            if (categoryId <= 0)
                return BadRequest("Invalid category ID.");

            var result = await _categoryRepository.GetTypesPagedAsync(categoryId, pageNumber, pageSize);

            return Ok(new
            {
                items = result.Items,
                totalCount = result.TotalCount,
                pageNumber,
                pageSize
            });
        }

        [HttpGet("types")]
        public async Task<IActionResult> GetAllTypes(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 5)
        {


            var result = await _categoryRepository.GetAllTypesPagedAsync(pageNumber, pageSize);

            return Ok(new
            {
                items = result.Items,
                totalCount = result.TotalCount,
                pageNumber,
                pageSize
            });
        }

        // =====================================================
        // GET TYPE DETAILS WITH PRODUCT COUNT
        // =====================================================
        [HttpGet("type/{typeId}/details")]
        public async Task<IActionResult> GetTypeDetails(int typeId)
        {
            if (typeId <= 0)
                return BadRequest("Invalid type ID.");

            var type = await _categoryRepository.GetTypeByIdAsync(typeId);
            if (type == null)
                return NotFound("Type not found.");

            var productCount = await _categoryRepository.GetProductCountByTypeIdAsync(typeId);

            return Ok(new
            {
                typeId = type.ProductTypeId,
                typeName = type.ProductTypeName,
                categoryId = type.CategoryId,
                productCount
            });
        }

        // =====================================================
        // CREATE CATEGORY PRODUCT TYPE
        // =====================================================
        [Authorize(Roles = "Admin")]
        [HttpPost("types/{categoryId}/add")]
        public async Task<IActionResult> AddCategoryType(int categoryId, [FromBody] string typeName)
        {
            // 1. Validate category ID
            if (categoryId <= 0)
                return BadRequest("Invalid category ID.");

            // 2. Validate type name is not empty
            if (string.IsNullOrWhiteSpace(typeName))
                return BadRequest("Type name is required.");

            var trimmedName = typeName.Trim();

            // 3. Validate minimum length
            if (trimmedName.Length < 3)
                return BadRequest("Type name must be at least 3 characters.");

            // 4. Validate allowed characters FIRST (before duplicate check)
            if (!ValidNamePattern.IsMatch(trimmedName))
                return BadRequest("Type name may only contain letters, spaces, dash (-), dot (.), and apostrophe (').");

            // 5. Check for duplicate type name within the same category
            var typeExists = await _categoryRepository.TypeNameExistsAsync(trimmedName, categoryId);
            if (typeExists)
                return Conflict("A type with this name already exists in this category.");

            // 6. Create type
            var type = new ProductType
            {
                CategoryId = categoryId,
                ProductTypeName = trimmedName
            };

            var created = await _categoryRepository.AddCategoryTypeAsync(type);

            return Ok(new
            {
                message = "Category type created successfully.",
                type = created
            });
        }

        // =====================================================
        // UPDATE CATEGORY PRODUCT TYPE
        // =====================================================
        [Authorize(Roles = "Admin")]
        [HttpPut("type/{typeId}")]
        public async Task<IActionResult> UpdateCategoryType(int typeId, [FromBody] string typeName)
        {
            // 1. Validate type ID
            if (typeId <= 0)
                return BadRequest("Invalid type ID.");

            // 2. Get existing type
            var existingType = await _categoryRepository.GetTypeByIdAsync(typeId);
            if (existingType == null)
                return NotFound("Type not found.");

            // 3. Validate type name is not empty
            if (string.IsNullOrWhiteSpace(typeName))
                return BadRequest("Type name is required.");

            var trimmedName = typeName.Trim();

            // 4. Validate minimum length
            if (trimmedName.Length < 3)
                return BadRequest("Type name must be at least 3 characters.");

            // 5. Validate allowed characters FIRST (before duplicate check)
            if (!ValidNamePattern.IsMatch(trimmedName))
                return BadRequest("Type name may only contain letters, spaces, dash (-), dot (.), and apostrophe (').");

            // 6. Check for duplicate type name (excluding current type)
            var typeExists = await _categoryRepository.TypeNameExistsAsync(
                trimmedName, 
                existingType.CategoryId ?? 0, 
                typeId
            );
            if (typeExists)
                return Conflict("A type with this name already exists in this category.");

            // 7. Update type using the repository method
            var updatedType = new ProductType
            {
                ProductTypeId = typeId,
                ProductTypeName = trimmedName,
                CategoryId = existingType.CategoryId
            };

            var result = await _categoryRepository.UpdateCategoryTypeAsync(updatedType);

            if (result == null)
                return NotFound("Failed to update type.");

            return Ok(new
            {
                message = "Type updated successfully.",
                type = result
            });
        }

        // =====================================================
        // DELETE CATEGORY PRODUCT TYPE
        // =====================================================
        [Authorize(Roles = "Admin")]
        [HttpDelete("type/{typeId}")]
        public async Task<IActionResult> DeleteCategoryType(int typeId)
        {
            if (typeId <= 0)
                return BadRequest("Invalid type ID.");

            var deleted = await _categoryRepository.DeleteCategoryTypeAsync(typeId);

            if (!deleted)
                return NotFound("Type not found.");

            return Ok("Type deleted successfully.");
        }
    }
}