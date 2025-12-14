using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Reorder;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IReorderRepository
    {
        // Paged + filtered reorder list (supports ID and search)
        Task<PagedResult<ReorderListDto>> GetAllReordersAsync(int pageNumber, int pageSize, string? search = null);

        // Single reorder details
        Task<ReorderDetailDto?> GetReorderByIdAsync(int id);

        // CRUD operations
        Task<Reorder> AddReorderAsync(Reorder reorder);
        Task<Reorder?> UpdateReorderAsync(Reorder reorder);
        Task<bool> DeleteReorderAsync(int id);
    }
}
    