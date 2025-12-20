using System.ComponentModel.DataAnnotations;

namespace QuickPharmaPlus.Server.ModelsDTO.Supplier
{
    public class CreateSupplierRequest
    {
        [Required(ErrorMessage = "Supplier name is required.")]
        [MinLength(3, ErrorMessage = "Supplier name must be at least 3 characters.")]
        public string? SupplierName { get; set; }

        [Required(ErrorMessage = "Representative name is required.")]
        [MinLength(3, ErrorMessage = "Representative name must be at least 3 characters.")]
        public string? Representative { get; set; }

        [Required(ErrorMessage = "Contact number is required.")]
        [MinLength(6, ErrorMessage = "Contact number must be at least 6 characters.")]
        public string? Contact { get; set; }

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Email must be valid.")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "City is required.")]
        public string? City { get; set; }

        [Required(ErrorMessage = "Block is required.")]
        public string? Block { get; set; }

        [Required(ErrorMessage = "Road is required.")]
        public string? Road { get; set; }

        [Required(ErrorMessage = "Building is required.")]
        public string? Building { get; set; }
    }
}