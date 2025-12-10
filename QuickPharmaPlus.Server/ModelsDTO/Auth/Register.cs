namespace QuickPharmaPlus.Server.ModelsDTO.Auth
{
    public class Register
    {
        // Required
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;

        // User profile fields
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;

        // Optional address fields
        public string? City { get; set; }
        public string? Block { get; set; }
        public string? Road { get; set; }
        public string? BuildingFloor { get; set; }
    }
}
