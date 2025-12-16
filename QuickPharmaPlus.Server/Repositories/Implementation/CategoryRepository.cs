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

            // Apply filtering
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
        // CHECK FOR DUPLICATE CATEGORY NAME
        // =============================================================
        public async Task<bool> CategoryNameExistsAsync(string categoryName, int? excludeId = null)
        {
            var normalizedName = categoryName.Trim().ToLower();

            var query = _context.Categories
                .Where(c => c.CategoryName.ToLower() == normalizedName);

            // Exclude current category when editing
            if (excludeId.HasValue)
            {
                query = query.Where(c => c.CategoryId != excludeId.Value);
            }

            return await query.AnyAsync();
        }

        // =============================================================
        // CHECK FOR DUPLICATE TYPE NAME (WITHIN SAME CATEGORY)
        // =============================================================
        public async Task<bool> TypeNameExistsAsync(string typeName, int categoryId, int? excludeTypeId = null)
        {
            var normalizedName = typeName.Trim().ToLower();

            var query = _context.ProductTypes
                .Where(pt => pt.CategoryId == categoryId && pt.ProductTypeName.ToLower() == normalizedName);

            // Exclude current type when editing
            if (excludeTypeId.HasValue)
            {
                query = query.Where(pt => pt.ProductTypeId != excludeTypeId.Value);
            }

            return await query.AnyAsync();
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
        // DELETE CATEGORY - SET PRODUCTS TO NULL, DELETE TYPES
        // =============================================================
        public async Task<bool> DeleteCategoryAsync(int id)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryId == id);

            if (category == null)
                return false;

            // DELETE related product types
            var relatedTypes = _context.ProductTypes.Where(pt => pt.CategoryId == id);
            _context.ProductTypes.RemoveRange(relatedTypes);

            // SET products' CategoryId to NULL instead of deleting them
            var relatedProducts = await _context.Products
                .Where(p => p.CategoryId == id)
                .ToListAsync();

            foreach (var product in relatedProducts)
            {
                product.CategoryId = null; // Set to null (Not Defined)
            }

            // DELETE the category
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

        public async Task<PagedResult<ProductType>> GetAllTypesPagedAsync(
            int pageNumber,
            int pageSize)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 5;

            var query = _context.ProductTypes;

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
        // GET TYPE DETAILS BY ID
        // =============================================================
        public async Task<ProductType?> GetTypeByIdAsync(int typeId)
        {
            return await _context.ProductTypes.FirstOrDefaultAsync(pt => pt.ProductTypeId == typeId);
        }

        // =============================================================
        // GET PRODUCT COUNT FOR A SPECIFIC TYPE
        // =============================================================
        public async Task<int> GetProductCountByTypeIdAsync(int typeId)
        {
            return await _context.Products
                .Where(p => p.ProductTypeId == typeId)
                .CountAsync();
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
        // UPDATE PRODUCT TYPE
        // =============================================================
        public async Task<ProductType?> UpdateCategoryTypeAsync(ProductType type)
        {
            var existing = await _context.ProductTypes
                .FirstOrDefaultAsync(pt => pt.ProductTypeId == type.ProductTypeId);

            if (existing == null)
                return null;

            existing.ProductTypeName = type.ProductTypeName;

            await _context.SaveChangesAsync();
            return existing;
        }

        // =============================================================
        // DELETE PRODUCT TYPE - SET PRODUCTS' ProductTypeId TO NULL
        // =============================================================
        public async Task<bool> DeleteCategoryTypeAsync(int typeId)
        {
            var type = await _context.ProductTypes
                .FirstOrDefaultAsync(pt => pt.ProductTypeId == typeId);

            if (type == null)
                return false;

            // SET products' ProductTypeId to NULL instead of deleting them
            var relatedProducts = await _context.Products
                .Where(p => p.ProductTypeId == typeId)
                .ToListAsync();

            foreach (var product in relatedProducts)
            {
                product.ProductTypeId = null; // Set to null (Not Defined)
            }

            // DELETE the product type
            _context.ProductTypes.Remove(type);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}