using System.ComponentModel.DataAnnotations;

namespace QuickPharmaPlus.Server.ModelsDTO.Supplier
{
    public class UpdateSupplierRequest
    {
        public int? SupplierId { get; set; }

        [MinLength(3, ErrorMessage = "Supplier name must be at least 3 characters.")]
        public string? SupplierName { get; set; }

        [MinLength(3, ErrorMessage = "Representative name must be at least 3 characters.")]
        public string? Representative { get; set; }

        [MinLength(6, ErrorMessage = "Contact number must be at least 6 characters.")]
        public string? Contact { get; set; }

        [EmailAddress(ErrorMessage = "Email must be valid.")]
        public string? Email { get; set; }

        public string? City { get; set; }
        public string? Block { get; set; }
        public string? Road { get; set; }
        public string? Building { get; set; }
    }
}