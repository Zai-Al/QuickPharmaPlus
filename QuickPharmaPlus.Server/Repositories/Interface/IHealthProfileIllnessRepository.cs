using QuickPharmaPlus.Server.ModelsDTO.HealthProfile;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IHealthProfileIllnessRepository
    {
        Task<List<HealthProfileIllnessDto>> GetMyAsync(int userId);

        Task<bool> AddAsync(int userId, int illnessId, int severityId);

        Task<bool> UpdateAsync(int userId, int healthProfileIllnessId, int illnessId, int severityId);

        Task<bool> RemoveAsync(int userId, int healthProfileIllnessId);
    }

}
