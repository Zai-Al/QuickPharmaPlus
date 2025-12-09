using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Supplier;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface ISupplierRepository
    {
        // PAGED + FILTERED SUPPLIERS (supports ID and name filtering)
        Task<PagedResult<SupplierListDto>> GetAllSuppliersAsync(int pageNumber, int pageSize, string? search = null);

        // GET SINGLE SUPPLIER DETAILS BY ID
        Task<Supplier?> GetSupplierByIdAsync(int id);

        // CREATE NEW SUPPLIER
        Task<Supplier> AddSupplierAsync(Supplier supplier);

        // UPDATE EXISTING SUPPLIER
        Task<Supplier?> UpdateSupplierAsync(Supplier supplier);

        // DELETE SUPPLIER (removes supplier orders/reorders and detaches products)
        Task<bool> DeleteSupplierAsync(int id);
    }
}
