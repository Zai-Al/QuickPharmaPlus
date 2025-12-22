using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.SupplierOrder;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface ISupplierOrderRepository
    {
        // Paged + filtered supplier order list (supports ID and search)
        Task<PagedResult<SupplierOrderListDto>> GetAllSupplierOrdersAsync(
            int pageNumber, 
            int pageSize, 
            string? search = null, 
            DateOnly? orderDate = null,
            int? branchId = null,
            int? statusId = null,
            int? typeId = null);

        // Single supplier order details
        Task<SupplierOrderDetailDto?> GetSupplierOrderByIdAsync(int id);

        // CRUD operations
        Task<SupplierOrder> AddSupplierOrderAsync(SupplierOrder supplierOrder);
        Task<SupplierOrder?> UpdateSupplierOrderAsync(SupplierOrder supplierOrder);
        Task<bool> DeleteSupplierOrderAsync(int id);
    }
}
