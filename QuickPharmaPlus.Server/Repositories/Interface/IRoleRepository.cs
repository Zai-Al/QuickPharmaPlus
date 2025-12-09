using QuickPharmaPlus.Server.ModelsDTO;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IRoleRepository
    {
        Task<IEnumerable<RoleDto>> GetAllRolesAsync();
    }
}
