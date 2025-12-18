using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Prescription;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IPrescriptionRepository
    {
        // Health/Profile prescriptions only (NO pagination)
        Task<List<PrescriptionListDto>> GetUserHealthPrescriptionsAsync(int userId);

        // (keep this if you want for internal/admin screens later)
        Task<PagedResult<PrescriptionListDto>> GetUserPrescriptionsAsync(
            int userId,
            int pageNumber,
            int pageSize,
            string? search = null,
            int[]? statusIds = null,
            bool? isHealth = null);

        Task<int> CreateAsync(int userId, PrescriptionCreateDto dto);

        Task<bool> UpdateAsync(int userId, int prescriptionId, PrescriptionUpdateDto dto);

        Task<bool> DeleteAsync(int userId, int prescriptionId);

        Task<(byte[] bytes, string contentType)?> GetPrescriptionDocumentAsync(int userId, int prescriptionId);

        Task<(byte[] bytes, string contentType)?> GetCprDocumentAsync(int userId, int prescriptionId);

        Task<int> CreateCheckoutAsync(int userId, PrescriptionCreateDto dto);

    }
}
