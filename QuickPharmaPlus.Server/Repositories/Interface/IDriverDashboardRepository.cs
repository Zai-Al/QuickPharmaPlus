using QuickPharmaPlus.Server.ModelsDTO.Dashboard;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IDriverDashboardRepository
    {
        Task<DriverDashboardDto> GetDriverDashboardDataAsync(int driverUserId, int branchId);
    }
}