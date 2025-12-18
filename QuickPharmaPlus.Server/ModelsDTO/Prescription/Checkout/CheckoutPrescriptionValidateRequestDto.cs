using QuickPharmaPlus.Server.ModelsDTO.WishList_Cart;
using System.Collections.Generic;

namespace QuickPharmaPlus.Server.ModelsDTO.Prescription.Checkout
{
    public class CheckoutPrescriptionValidateRequestDto
    {
        public int UserId { get; set; }
        public int PrescriptionId { get; set; } // code OR selected health prescription
        public bool IsHealthProfile { get; set; }

        // send cart items exactly as CartController returns
        public List<CartItemDto> CartItems { get; set; } = new();
    }
}
