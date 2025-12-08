using System.ComponentModel.DataAnnotations;

namespace QuickPharmaPlus.Server.ModelsDTO.Auth
{
    public class ResetPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string? Email { get; set; }

        [Required]
        public string? Token { get; set; }

        [Required]
        public string? NewPassword { get; set; }

        [Required]
        public string? ConfirmPassword { get; set; }
    }
}
