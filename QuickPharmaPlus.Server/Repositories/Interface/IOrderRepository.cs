using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Checkout;
using QuickPharmaPlus.Server.ModelsDTO.Order;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IOrderRepository
    {
        Task<ShippingValidationResultDto> ValidateShippingAsync(CheckoutShippingRequestDto req);

        Task<List<AvailableSlotsByDateDto>> GetAvailableDeliverySlotsAsync(
            int branchId,
            int daysAhead = 6
        );

        Task<PagedResult<MyOrderListDto>> GetMyOrdersAsync(
        int userId,
        int pageNumber,
        int pageSize,
        string? search = null,
        int? statusId = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null,
        string? sortBy = null
    );

        Task<MyOrderDetailsDto?> GetMyOrderDetailsAsync(int userId, int orderId);
    }
}
