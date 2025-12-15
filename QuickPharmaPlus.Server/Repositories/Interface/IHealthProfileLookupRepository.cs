using QuickPharmaPlus.Server.ModelsDTO.HealthProfile;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IHealthProfileLookupRepository
    {
        Task<List<IllnessNameOptionDto>> GetIllnessNamesAsync(int? userId, int? includeIllnessNameId);

        // NEW:
        Task<List<AllergyDto>> GetAllergyNamesAsync(int? userId, int? includeAllergyNameId);

        Task<List<SeverityOptionDto>> GetSeveritiesAsync();
    }
}
