using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Checkout;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IShippingRepository
    {
        Task<Shipping> CreatePickupAsync(int userId, int branchId);
        Task<Shipping> CreateDeliveryAsync(
            int userId,
            int cityId,
            string block,
            string road,
            string buildingNumber,
            IEnumerable<int> productIds
        );

        Task<Shipping> CreateDeliveryByProductNamesAsync(
    int userId,
    int cityId,
    string block,
    string road,
    string buildingNumber,
    IEnumerable<string> productNames
);

        Task<bool> HasStockForAllProductsAsync(
            int branchId,
            IEnumerable<int> productIds,
            bool ignoreExpired = true
        );


        Task<ShippingValidationResultDto> ValidateShippingAsync(CheckoutShippingRequestDto req);

    }
}
