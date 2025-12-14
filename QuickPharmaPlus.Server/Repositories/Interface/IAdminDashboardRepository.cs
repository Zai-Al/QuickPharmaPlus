using QuickPharmaPlus.Server.ModelsDTO.Dashboard;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IAdminDashboardRepository
    {
        Task<AdminDashboardDto> GetAdminDashboardDataAsync();
    }
}