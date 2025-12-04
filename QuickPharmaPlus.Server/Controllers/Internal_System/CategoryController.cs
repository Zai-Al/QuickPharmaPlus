using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Category;       // <-- You will create this folder/file
using Microsoft.AspNetCore.Http;
using QuickPharmaPlus.Server.Repositories.Implementation;

namespace QuickPharmaPlus.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly CategoryRepository _categoryRepository;

        public CategoryController(CategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        // -------------------------------------------------------
        // POST: api/category  (CREATE)
        // -------------------------------------------------------
        [HttpPost]
        [Route("add")]
        public async Task<IActionResult> CreateCategory([FromForm] CategoryCreateDto model)
        {
            // 1) SERVER VALIDATION
            if (string.IsNullOrWhiteSpace(model.CategoryName))
            {
                return BadRequest("Category name is required.");
            }

            // 2) CONVERT IMAGE (IF PROVIDED)
            byte[]? imageBytes = null;

            if (model.CategoryImage != null)
            {
                using var ms = new MemoryStream();
                await model.CategoryImage.CopyToAsync(ms);
                imageBytes = ms.ToArray();
            }

            // 3) CREATE CATEGORY OBJECT
            var category = new Category
            {
                CategoryName = model.CategoryName,
                CategoryImage = imageBytes
            };

            // 4) SAVE USING REPOSITORY
            var createdCategory = await _categoryRepository.CreateCategoryAsync(category);

            // 5) RETURN SUCCESS
            return Ok(new
            {
                message = "Category created successfully.",
                category = createdCategory
            });
        }

        // -------------------------------------------------------
        // GET: api/category
        // -------------------------------------------------------
        [HttpGet]
        public async Task<IActionResult> GetAllCategories()
        {
            var categories = await _categoryRepository.GetAllCategoriesAsync();
            return Ok(categories);
        }

        // -------------------------------------------------------
        // GET: api/category/{id}
        // -------------------------------------------------------
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategoryById(int id)
        {
            var category = await _categoryRepository.GetCategoryByIdAsync(id);

            if (category == null)
                return NotFound("Category not found.");

            return Ok(category);
        }

        // -------------------------------------------------------
        // PUT: api/category/{id}
        // -------------------------------------------------------
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

            var updatedCategory = new Category
            {
                CategoryName = model.CategoryName,
                CategoryImage = imageBytes
            };

            var result = await _categoryRepository.UpdateCategoryAsync(id, updatedCategory);

            if (result == null)
                return NotFound("Category not found.");

            return Ok(result);
        }

        // -------------------------------------------------------
        // DELETE: api/category/{id}
        // -------------------------------------------------------
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var deleted = await _categoryRepository.DeleteCategoryAsync(id);

            if (!deleted)
                return NotFound("Category not found.");

            return Ok("Category deleted successfully.");
        }
    }
}
