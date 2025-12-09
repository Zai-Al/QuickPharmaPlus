using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Category;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface ICategoryRepository
    {
        // PAGED CATEGORIES LIST
        Task<PagedResult<CategoryListDto>> GetAllCategoriesAsync(int pageNumber, int pageSize, string? search = null);

        // GET CATEGORY DETAILS
        Task<Category?> GetCategoryByIdAsync(int id);

        // CREATE CATEGORY
        Task<Category> AddCategoryAsync(Category category);

        // UPDATE CATEGORY
        Task<Category?> UpdateCategoryAsync(Category category);

        // DELETE CATEGORY (safe cascade for related types/products)
        Task<bool> DeleteCategoryAsync(int id);

        // PAGED TYPES LIST (optional if you need pagination)
        Task<PagedResult<ProductType>> GetTypesPagedAsync(int categoryId, int pageNumber, int pageSize);


        // CREATE TYPE
        Task<ProductType> AddCategoryTypeAsync(ProductType type);

        // DELETE TYPE
        Task<bool> DeleteCategoryTypeAsync(int typeId);
    }
}
