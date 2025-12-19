using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Checkout;
using QuickPharmaPlus.Server.ModelsDTO.Inventory;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IInventoryRepository
    {
        // Fetches all inventories with pagination and optional search (searches by inventory id or product name).
        Task<PagedResult<InventoryListDto>> GetAllInventoriesAsync(
    int pageNumber,
    int pageSize,
    string? search = null,
    DateOnly? expiryDate = null);

        // Fetches a single inventory by id. Includes branch address (mapped into InventoryDetailDto.Address).
        Task<InventoryDetailDto?> GetInventoryByIdAsync(int id);

        // Adds a new inventory record. Returns the created Inventory entity.
        Task<Inventory> AddInventoryAsync(Inventory inventory);

        // Updates an existing inventory by id. Returns the updated Inventory or null if not found.
        Task<Inventory?> UpdateInventoryAsync(Inventory inventory);

        // Deletes an inventory by id. Returns true if deleted, false when not found.
        Task<bool> DeleteInventoryAsync(int id);

        // Fetches expired inventories with pagination and optional search (by supplier name).
        Task<PagedResult<ExpiredInventoryListDto>> GetExpiredInventoriesAsync(
            int pageNumber,
            int pageSize,
            int daysBeforeExpiry = 29,
            string? search = null,
            string? supplierName = null,
            DateOnly? expiryDate = null);

        // Fetches details of a single expired inventory by id.
        Task<ExpiredInventoryListDto?> GetExpiredInventoryDetailsAsync(int inventoryId);

        Task<List<UnavailableProductDto>> GetUnavailableProductsForBranchAsync(
            int branchId,
            List<CheckoutCartItemDto> items
        );
    }
}