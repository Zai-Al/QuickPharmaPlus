using QuickPharmaPlus.Server.ModelsDTO.Delivery;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IDeliveryRequestRepository
    {
        Task<DeliveryRequestsPagedResultDto> GetDeliveryRequestsAsync(
            string identityUserId,
            bool isAdmin,
            int pageNumber,
            int pageSize,
            int? orderId = null,
            int? statusId = null,
            int? paymentMethodId = null,
            bool? isUrgent = null);

        Task<bool> UpdateDeliveryStatusAsync(
            string identityUserId,
            bool isAdmin,
            int orderId,
            UpdateDeliveryStatusRequestDto dto,
            CancellationToken ct = default);
    }
}