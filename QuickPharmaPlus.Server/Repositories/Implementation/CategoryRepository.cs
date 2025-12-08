using QuickPharmaPlus.Server.Models;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.ModelsDTO.Category;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class CategoryRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public CategoryRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        // 1. GET ALL CATEGORIES (PAGED)
        // Returns a tuple: (Items, TotalCategories)
        public async Task<(List<CategoryListDto> Items, int TotalCategories)> GetAllCategoriesAsync(int pageNumber = 1, int pageSize = 10, string? search = null)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            var query = _context.Categories.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(c => EF.Functions.Like(c.CategoryName, $"%{search}%"));
            }

            // total number of categories (used for paging)
            var totalCategories = await query.CountAsync();

            var items = await query
                .OrderBy(c => c.CategoryId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CategoryListDto
                {
                    CategoryId = c.CategoryId,
                    CategoryName = c.CategoryName,
                    CategoryImage = c.CategoryImage,
                    // correlated subquery to compute how many products belong to this category
                    ProductCount = _context.Products.Count(p => p.CategoryId == c.CategoryId)
                })
                .ToListAsync();

            return (items, totalCategories);
        }

        //GET ALL TYPES BY CATEGORY ID
        public async Task<List<ProductType>> GetAllTypesByCategoryIdAsync(int categoryId)
        {
            return await _context.ProductTypes
                .Where(pt => pt.CategoryId == categoryId)
                .Select(pt => new ProductType
                {
                    ProductTypeId = pt.ProductTypeId,
                    ProductTypeName = pt.ProductTypeName,
                    CategoryId = pt.CategoryId
                })
                .ToListAsync();
        }

        // 2. GET CATEGORY BY ID
        public async Task<Category?> GetCategoryByIdAsync(int id)
        {
            return await _context.Categories
                .Where(c => c.CategoryId == id)
                .Select(c => new Category
                {
                    CategoryId = c.CategoryId,
                    CategoryName = c.CategoryName,
                    CategoryImage = c.CategoryImage
                })
                .FirstOrDefaultAsync();
        }

        // 3. CREATE CATEGORY
        public async Task<Category> CreateCategoryAsync(Category category)
        {
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            return category;
        }

        // 4. UPDATE CATEGORY
        public async Task<Category?> UpdateCategoryAsync(int id, Category updatedCategory)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryId == id);

            if (category == null)
                return null;

            category.CategoryName = updatedCategory.CategoryName;
            category.CategoryImage = updatedCategory.CategoryImage;

            await _context.SaveChangesAsync();
            return category;
        }

        // 5. DELETE CATEGORY
        public async Task<bool> DeleteCategoryAsync(int id)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryId == id);

            if (category == null)
                return false;

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
