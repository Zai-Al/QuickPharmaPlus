using QuickPharmaPlus.Server.ModelsDTO.Dashboard;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IPharmacistDashboardRepository
    {
        Task<PharmacistDashboardDto> GetPharmacistDashboardDataAsync(int pharmacistUserId, int branchId);
    }
}