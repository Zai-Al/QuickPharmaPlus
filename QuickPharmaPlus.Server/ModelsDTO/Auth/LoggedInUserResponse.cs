using QuickPharmaPlus.Server.ModelsDTO.Address;

namespace QuickPharmaPlus.Server.ModelsDTO.Auth
{
    public class LoggedInUserResponse
    {
        public string? IdentityId { get; set; }
        public int UserId { get; set; }
        public string? Email { get; set; }
        public string[]? Roles { get; set; }

        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? ContactNumber { get; set; }

        public int? BranchId { get; set; }
        public int? RoleId { get; set; }
        public int? AddressId { get; set; }

        // New: full address payload
        public AddressDto? Address { get; set; }
    }
}
