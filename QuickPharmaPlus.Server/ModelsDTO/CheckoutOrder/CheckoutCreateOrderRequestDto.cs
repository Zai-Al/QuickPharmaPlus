using Microsoft.AspNetCore.Http;

namespace QuickPharmaPlus.Server.ModelsDTO.CheckoutOrder
{
    public class CheckoutCreateOrderRequestDto
    {
        public int UserId { get; set; }

        // SHIPPING
        public string Mode { get; set; } = "pickup"; // pickup | delivery
        public int? PickupBranchId { get; set; }

        public bool UseSavedAddress { get; set; }
        public int? CityId { get; set; }
        public string? Block { get; set; }
        public string? Road { get; set; }
        public string? BuildingFloor { get; set; }

        public bool IsUrgent { get; set; }
        public DateOnly? ShippingDate { get; set; } // delivery & not urgent
        public int? SlotId { get; set; }           // delivery & not urgent

        // PRESCRIPTION CHECKOUT
        // If there are prescribed items in cart, user must provide ONE of these:
        public int? ApprovedPrescriptionId { get; set; }  // health profile selected OR code resolved to prescriptionId
        public bool IsHealthProfile { get; set; } = false;

        // If they uploaded a new checkout prescription, you will create it first:
        public bool UploadNewPrescription { get; set; } = false;
        public IFormFile? PrescriptionDocument { get; set; }
        public IFormFile? CprDocument { get; set; }

        // PAYMENT
        public string? PaymentMethod { get; set; } // "cash" | "online"
        public string? StripeSessionId { get; set; }
        public string? StripePaymentIntentId { get; set; }

    }
}
