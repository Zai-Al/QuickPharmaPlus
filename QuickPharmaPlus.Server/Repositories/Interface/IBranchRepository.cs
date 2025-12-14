using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Branch;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IBranchRepository
    {
        Task<PagedResult<BranchListDto>> GetAllBranchesAsync(
            int pageNumber,
            int pageSize,
            string? search = null
        );
    }
}
