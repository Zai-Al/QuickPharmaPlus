using QuickPharmaPlus.Server.ModelsDTO.WishList_Cart;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface ICartRepository
    {
        Task<List<CartItemDto>> GetMyAsync(int userId);

        // returns:
        // added = true/false
        // reason = "OK" | "OUT_OF_STOCK" | "EXCEEDS_AVAILABLE_STOCK" | "PRODUCT_NOT_FOUND"
        Task<(bool added, string reason)> AddAsync(int userId, int productId, int quantity);

        // set absolute quantity (if quantity <= 0 -> remove)
        Task<(bool updated, string reason)> UpdateQtyAsync(int userId, int productId, int quantity);

        Task<bool> RemoveAsync(int userId, int productId);
        Task<int> ClearAsync(int userId);
    }
}
