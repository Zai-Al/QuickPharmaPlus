using System.ComponentModel.DataAnnotations;

namespace QuickPharmaPlus.Server.ModelsDTO.Auth
{
    public class ValidatePasswordRequest
    {
        [Required]
        public string? Password { get; set; }
    }
}