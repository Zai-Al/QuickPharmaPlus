using QuickPharmaPlus.Server.ModelsDTO.PrescriptionPlan;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IPrescriptionPlanRepository
    {
        Task<List<PrescriptionPlanEligibleDto>> GetEligiblePrescriptionsAsync(int userId);
        Task<List<PrescriptionPlanItemDto>> GetPlanItemsAsync(int userId, int prescriptionId);

        Task<int?> CreateAsync(int userId, PrescriptionPlanUpsertDto dto);
        Task<bool> UpdateAsync(int userId, int planId, PrescriptionPlanUpsertDto dto);
        Task<bool> DeleteAsync(int userId, int planId);

        Task<List<PrescriptionPlanListDto>> GetUserPlansAsync(int userId);
        Task<PrescriptionPlanListDto?> GetPlanDetailsAsync(int planId, int userId);
    }
}
