using QuickPharmaPlus.Server.ModelsDTO.Checkout;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IOrderRepository
    {
        Task<ShippingValidationResultDto> ValidateShippingAsync(CheckoutShippingRequestDto req);

        Task<List<AvailableSlotsByDateDto>> GetAvailableDeliverySlotsAsync(
            int branchId,
            int daysAhead = 6
        );

        // you’ll implement later when you’re ready to save order + product orders
        // Task<int> CreateOrderFromCheckoutAsync(CheckoutCreateOrderDto req);
    }
}
