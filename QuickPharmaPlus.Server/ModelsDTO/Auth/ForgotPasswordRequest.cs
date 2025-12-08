using System.ComponentModel.DataAnnotations;

namespace QuickPharmaPlus.Server.ModelsDTO.Auth
{
    public class ForgotPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string? Email { get; set; }
    }
}
