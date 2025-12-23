using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Prescription;
using QuickPharmaPlus.Server.ModelsDTO.Prescription.Approval;
using QuickPharmaPlus.Server.ModelsDTO.Prescription.Checkout;
using QuickPharmaPlus.Server.ModelsDTO.WishList_Cart;
using System.Collections.Generic;
using System.Threading.Tasks;

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
        Task<PrescriptionListDto?> GetUserHealthPrescriptionByIdAsync(int userId, int prescriptionId);

        Task<CheckoutPrescriptionValidateResponseDto> ValidateCheckoutPrescriptionAsync(
            int userId,
            int prescriptionId,
            List<CartItemDto> cartItems,
            bool isHealthProfile
        );

        Task<PagedResult<PrescriptionListDto>> GetAllPrescriptionsAsync(
            int pageNumber,
            int pageSize,
            int? customerId = null,
            int? statusId = null,
            DateOnly? prescriptionDate = null,
            int? branchId = null        
            );

        Task<IEnumerable<PrescriptionStatus>> GetAllStatusesAsync();

        Task<InternalPrescriptionDetailsDto?> GetInternalPrescriptionDetailsAsync(
            int prescriptionId,
            int? branchId
        );

        Task<(byte[] bytes, string contentType, string? fileName)?> GetInternalPrescriptionDocumentAsync(
            int prescriptionId,
            int? branchId
        );

        Task<(byte[] bytes, string contentType, string? fileName)?> GetInternalCprDocumentAsync(
            int prescriptionId,
            int? branchId
        );

        Task<PrescriptionApproveResultDto?> ApprovePrescriptionAsync(
            int prescriptionId,
            int employeeUserId,
            PrescriptionApproveRequestDto dto);
    }
}
