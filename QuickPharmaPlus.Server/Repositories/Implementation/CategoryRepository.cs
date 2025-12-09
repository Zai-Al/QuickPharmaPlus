using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Category;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public CategoryRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        // =============================================================
        // PAGED + FILTERED CATEGORY LIST (supports ID and name filtering)
        // =============================================================
        public async Task<PagedResult<CategoryListDto>> GetAllCategoriesAsync(
            int pageNumber,
            int pageSize,
            string? search = null)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            // Base query
            var query = _context.Categories.AsQueryable();

            // 🔍 Apply filtering
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();

                // ID exact match check
                bool isNumericId = int.TryParse(term, out int idValue);

                if (isNumericId)
                {
                    query = query.Where(c => c.CategoryId == idValue);
                }
                else
                {
                    // Name starts-with match rather than ANY contains
                    query = query.Where(c =>
                        c.CategoryName.ToLower().StartsWith(term)
                    );
                }
            }

            // Count AFTER filtering
            var filteredCount = await query.CountAsync();

            // Apply paging + map projection
            var items = await query
                .OrderBy(c => c.CategoryId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CategoryListDto
                {
                    CategoryId = c.CategoryId,
                    CategoryName = c.CategoryName,
                    CategoryImage = c.CategoryImage,
                    ProductCount = _context.Products.Count(p => p.CategoryId == c.CategoryId)
                })
                .ToListAsync();

            return new PagedResult<CategoryListDto>
            {
                Items = items,
                TotalCount = filteredCount
            };
        }

        // =============================================================
        // GET CATEGORY DETAILS BY ID
        // =============================================================
        public async Task<Category?> GetCategoryByIdAsync(int id)
        {
            return await _context.Categories.FirstOrDefaultAsync(c => c.CategoryId == id);
        }

        // =============================================================
        // CREATE NEW CATEGORY
        // =============================================================
        public async Task<Category> AddCategoryAsync(Category category)
        {
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            return category;
        }

        // =============================================================
        // UPDATE EXISTING CATEGORY
        // =============================================================
        public async Task<Category?> UpdateCategoryAsync(Category category)
        {
            var existing = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryId == category.CategoryId);

            if (existing == null)
                return null;

            existing.CategoryName = category.CategoryName;
            existing.CategoryImage = category.CategoryImage;

            await _context.SaveChangesAsync();
            return existing;
        }

        // =============================================================
        // DELETE CATEGORY + RELATED PRODUCTS AND TYPES
        // =============================================================
        public async Task<bool> DeleteCategoryAsync(int id)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryId == id);

            if (category == null)
                return false;

            var relatedTypes = _context.ProductTypes.Where(pt => pt.CategoryId == id);
            _context.ProductTypes.RemoveRange(relatedTypes);

            var relatedProducts = _context.Products.Where(p => p.CategoryId == id);
            _context.Products.RemoveRange(relatedProducts);

            _context.Categories.Remove(category);

            await _context.SaveChangesAsync();
            return true;
        }

        // =============================================================
        // PAGED LIST OF PRODUCT TYPES FOR A CATEGORY
        // =============================================================
        public async Task<PagedResult<ProductType>> GetTypesPagedAsync(
            int categoryId,
            int pageNumber,
            int pageSize)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 5;

            var query = _context.ProductTypes.Where(pt => pt.CategoryId == categoryId);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderBy(pt => pt.ProductTypeId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<ProductType>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        // =============================================================
        // ADD PRODUCT TYPE TO CATEGORY
        // =============================================================
        public async Task<ProductType> AddCategoryTypeAsync(ProductType type)
        {
            _context.ProductTypes.Add(type);
            await _context.SaveChangesAsync();
            return type;
        }

        // =============================================================
        // DELETE PRODUCT TYPE
        // =============================================================
        public async Task<bool> DeleteCategoryTypeAsync(int typeId)
        {
            var type = await _context.ProductTypes
                .FirstOrDefaultAsync(pt => pt.ProductTypeId == typeId);

            if (type == null)
                return false;

            _context.ProductTypes.Remove(type);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
