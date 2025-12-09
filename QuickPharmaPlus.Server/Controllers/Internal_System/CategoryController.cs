using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Category;
using QuickPharmaPlus.Server.Repositories.Interface;

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

        // =====================================================
        // GET CATEGORIES (PAGED LIST)
        // =====================================================
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAllCategories(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null)
        {
            var result = await _categoryRepository.GetAllCategoriesAsync(pageNumber, pageSize, search);

            return Ok(new
            {
                items = result.Items,
                totalCount = result.TotalCount
            });
        }

        // =====================================================
        // GET CATEGORY DETAILS BY ID
        // =====================================================
        [Authorize]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategoryById(int id)
        {
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
            if (string.IsNullOrWhiteSpace(model.CategoryName))
                return BadRequest("Category name is required.");

            byte[]? imageBytes = null;

            if (model.CategoryImage != null)
            {
                using var ms = new MemoryStream();
                await model.CategoryImage.CopyToAsync(ms);
                imageBytes = ms.ToArray();
            }

            var category = new Category
            {
                CategoryName = model.CategoryName,
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
            if (string.IsNullOrWhiteSpace(model.CategoryName))
                return BadRequest("Category name is required.");

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
                CategoryName = model.CategoryName,
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
            var deleted = await _categoryRepository.DeleteCategoryAsync(id);

            if (!deleted)
                return NotFound("Category not found or could not be deleted.");

            return Ok("Category deleted successfully.");
        }

        // =====================================================
        // GET TYPES OF CATEGORY (NEW ROUTE FORMAT)
        // /api/category/types/{categoryId}?pageNumber=1&pageSize=10
        // =====================================================
        [HttpGet("types/{categoryId}")]
        public async Task<IActionResult> GetTypes(
            int categoryId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 5)
        {
            var result = await _categoryRepository.GetTypesPagedAsync(categoryId, pageNumber, pageSize);

            return Ok(new
            {
                items = result.Items,
                totalCount = result.TotalCount
            });
        }

        // =====================================================
        // CREATE TYPE (NEW ROUTE FORMAT)
        // /api/category/types/{categoryId}/add
        // =====================================================
        [Authorize(Roles = "Admin")]
        [HttpPost("types/{categoryId}/add")]
        public async Task<IActionResult> AddCategoryType(int categoryId, [FromBody] string typeName)
        {
            if (string.IsNullOrWhiteSpace(typeName))
                return BadRequest("Type name is required");

            var type = new ProductType
            {
                CategoryId = categoryId,
                ProductTypeName = typeName
            };

            var created = await _categoryRepository.AddCategoryTypeAsync(type);

            return Ok(new
            {
                message = "Category type created successfully.",
                type = created
            });
        }

        // =====================================================
        // /api/category/type/{typeId}
        // =====================================================
        [Authorize(Roles = "Admin")]
        [HttpDelete("type/{typeId}")]
        public async Task<IActionResult> DeleteCategoryType(int typeId)
        {
            var deleted = await _categoryRepository.DeleteCategoryTypeAsync(typeId);

            if (!deleted)
                return NotFound("Type not found.");

            return Ok("Type deleted successfully.");
        }
    }
}
