using System.Collections.Generic;

namespace QuickPharmaPlus.Server.ModelsDTO.Prescription.Checkout
{
    public class CheckoutPrescriptionValidateResponseDto
    {
        public bool IsValid { get; set; }
        public string Reason { get; set; } = "";

        public List<ItemResult> Items { get; set; } = new();

        public class ItemResult
        {
            public int ProductId { get; set; }
            public string? ProductName { get; set; }
            public int CartQuantity { get; set; }

            public bool Matches { get; set; }
            public string Reason { get; set; } = "";

            public int? ApprovedQuantity { get; set; }
            public string? ApprovedProductName { get; set; }
        }
    }
}
