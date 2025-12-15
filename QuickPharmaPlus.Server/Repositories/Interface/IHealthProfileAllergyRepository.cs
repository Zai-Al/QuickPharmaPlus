using QuickPharmaPlus.Server.ModelsDTO.HealthProfile;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IHealthProfileAllergyRepository
    {
        Task<List<HealthProfileAllergyDto>> GetMyAsync(int userId);
        Task<bool> AddAsync(int userId, int allergyId, int severityId);
        Task<bool> UpdateAsync(int userId, int healthProfileAllergyId, int allergyId, int severityId);
        Task<bool> RemoveAsync(int userId, int healthProfileAllergyId);
    }
}
