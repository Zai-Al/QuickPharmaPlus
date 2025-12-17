namespace QuickPharmaPlus.Server.ModelsDTO.Employee
{
    public class CreateEmployeeDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;  // Role name (Admin, Manager, etc.)
        public string Email { get; set; } = string.Empty;
        public string TempPassword { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public int? BranchId { get; set; }
        
        // Address fields
        public int? CityId { get; set; }
        public string? Block { get; set; }
        public string? Road { get; set; }
        public string? Building { get; set; }
    }
}