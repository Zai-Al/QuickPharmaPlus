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
        private static readonly Regex ValidNamePattern = new(@"^[A-Za-z\s-]*$");
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
                        return BadRequest("Category name may only contain letters, spaces, and dashes.");
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
        // CREATE CATEGORY
        // =====================================================
        [Authorize(Roles = "Admin")]
        [HttpPost("add")]
        public async Task<IActionResult> AddCategory([FromForm] CategoryCreateDto model)
        {
            // Validate name
            if (string.IsNullOrWhiteSpace(model.CategoryName))
                return BadRequest("Category name is required.");

            if (!ValidNamePattern.IsMatch(model.CategoryName.Trim()))
                return BadRequest("Category name may contain only letters, spaces, and dashes.");

            byte[]? imageBytes = null;

            if (model.CategoryImage != null)
            {
                using var ms = new MemoryStream();
                await model.CategoryImage.CopyToAsync(ms);
                imageBytes = ms.ToArray();
            }

            var category = new Category
            {
                CategoryName = model.CategoryName.Trim(),
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
            // Validate ID
            if (id <= 0)
                return BadRequest("Invalid category ID.");

            // Validate name
            if (string.IsNullOrWhiteSpace(model.CategoryName))
                return BadRequest("Category name is required.");

            if (!ValidNamePattern.IsMatch(model.CategoryName.Trim()))
                return BadRequest("Category name may contain only letters, spaces, and dashes.");

            byte[]? imageBytes = null;

            if (model.CategoryImage != null)
            {
                using var ms = new MemoryStream();
                await model.CategoryImage.CopyToAsync(ms);
                imageBytes = ms.ToArray();
            }

            var updated = new Category
            {
                CategoryId = id,
                CategoryName = model.CategoryName.Trim(),
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
        // CREATE CATEGORY PRODUCT TYPE
        // =====================================================
        [Authorize(Roles = "Admin")]
        [HttpPost("types/{categoryId}/add")]
        public async Task<IActionResult> AddCategoryType(int categoryId, [FromBody] string typeName)
        {
            if (categoryId <= 0)
                return BadRequest("Invalid category ID.");

            if (string.IsNullOrWhiteSpace(typeName))
                return BadRequest("Type name is required.");

            // Validate type name same rule as category name
            if (!ValidNamePattern.IsMatch(typeName.Trim()))
                return BadRequest("Type name may contain only letters, spaces, and dashes.");

            var type = new ProductType
            {
                CategoryId = categoryId,
                ProductTypeName = typeName.Trim()
            };

            var created = await _categoryRepository.AddCategoryTypeAsync(type);

            return Ok(new
            {
                message = "Category type created successfully.",
                type = created
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
