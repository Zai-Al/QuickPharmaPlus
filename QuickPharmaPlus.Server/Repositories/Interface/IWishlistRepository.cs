using QuickPharmaPlus.Server.ModelsDTO.WishList_Cart;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IWishlistRepository
    {
        Task<bool> AddAsync(int userId, int productId);
        Task<bool> RemoveAsync(int userId, int productId);
        Task<HashSet<int>> GetMyIdsAsync(int userId);
        Task<List<WishlistItemDto>> GetMyAsync(int userId);
        Task<(List<WishlistItemDto> Items, int TotalCount)> GetMyPagedAsync(int userId, int page, int pageSize);

    }
}
