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

        // ============================================
        // PAGED CATEGORIES LIST
        // ============================================
        public async Task<PagedResult<CategoryListDto>> GetAllCategoriesAsync(
            int pageNumber,
            int pageSize,
            string? search = null)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            var query = _context.Categories.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(c =>
                    EF.Functions.Like(c.CategoryName, $"%{search}%"));
            }

            var totalCount = await query.CountAsync();

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
                TotalCount = totalCount
            };
        }

        // ============================================
        // GET CATEGORY DETAILS
        // ============================================
        public async Task<Category?> GetCategoryByIdAsync(int id)
        {
            return await _context.Categories.FirstOrDefaultAsync(c => c.CategoryId == id);
        }

        // ============================================
        // CREATE CATEGORY
        // ============================================
        public async Task<Category> AddCategoryAsync(Category category)
        {
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            return category;
        }

        // ============================================
        // UPDATE CATEGORY
        // ============================================
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

        // ============================================
        // DELETE CATEGORY (SAFE CASCADE)
        // ============================================
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

        // ============================================
        // PAGED TYPES LIST
        // ============================================
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


        // ============================================
        // CREATE TYPE
        // ============================================
        public async Task<ProductType> AddCategoryTypeAsync(ProductType type)
        {
            _context.ProductTypes.Add(type);
            await _context.SaveChangesAsync();
            return type;
        }

        // ============================================
        // DELETE TYPE
        // ============================================
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
