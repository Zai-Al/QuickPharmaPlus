using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Product;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IProductRepository
    {
        Task<PagedResult<ProductListDto>> GetAllProductsAsync(
            int pageNumber,
            int pageSize,
            string? search = null,
            int? supplierId = null,
            int? categoryId = null);

        Task<ProductDetailDto?> GetProductByIdAsync(int id);
        Task<Product> AddProductAsync(Product product);
        Task<Product?> UpdateProductAsync(Product product);
        Task<bool> DeleteProductAsync(int id);
        Task<bool> ProductNameExistsAsync(string name, int? excludeId = null);
        Task<List<ProductListDto>> GetBestSellersAsync(int top = 10);


        Task<PagedResult<ProductListDto>> GetExternalProductsAsync(
            int pageNumber,
            int pageSize,
            string? search = null,
            int[]? supplierIds = null,
            int[]? categoryIds = null,
            int[]? productTypeIds = null,
            int[]? branchIds = null,
            decimal? minPrice = null,
            decimal? maxPrice = null,
            string? sortBy = null);
    }
}