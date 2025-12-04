using QuickPharmaPlus.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class CategoryRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public CategoryRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        // 1. GET ALL CATEGORIES
        public async Task<List<Category>> GetAllCategoriesAsync()
        {
            return await _context.Categories
                .Select(c => new Category
                {
                    CategoryId = c.CategoryId,
                    CategoryName = c.CategoryName,
                    CategoryImage = c.CategoryImage
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
