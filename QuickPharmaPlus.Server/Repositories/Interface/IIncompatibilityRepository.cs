using QuickPharmaPlus.Server.ModelsDTO.Incompatibility; 

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IIncompatibilityRepository
    {
        Task<Dictionary<int, CustomerIncompatibilitiesDto>> GetMapAsync(int userId, List<int> productIds);
    }
}
