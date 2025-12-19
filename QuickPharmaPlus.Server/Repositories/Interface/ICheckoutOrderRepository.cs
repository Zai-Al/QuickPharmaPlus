using QuickPharmaPlus.Server.ModelsDTO.CheckoutOrder;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface ICheckoutOrderRepository
    {
        Task<CheckoutCreateOrderResponseDto> CreateOrderFromCheckoutAsync(CheckoutCreateOrderRequestDto req);
    }
}
