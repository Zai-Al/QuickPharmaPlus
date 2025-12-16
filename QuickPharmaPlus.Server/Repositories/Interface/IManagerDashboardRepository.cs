using QuickPharmaPlus.Server.ModelsDTO.Dashboard;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IManagerDashboardRepository
    {
        Task<ManagerDashboardDto> GetManagerDashboardDataAsync(int branchId);
    }
}