using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Product;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IProductRepository
    {
        // Paged + filtered product list (supports id or name search)
        Task<PagedResult<ProductListDto>> GetAllProductsAsync(int pageNumber, int pageSize, string? search = null, int? supplierId = null, int? categoryId = null);

        // Single product details
        Task<ProductDetailDto?> GetProductByIdAsync(int id);

        // CRUD
        Task<Product> AddProductAsync(Product product);
        Task<Product?> UpdateProductAsync(Product product);
        Task<bool> DeleteProductAsync(int id);
    }
}