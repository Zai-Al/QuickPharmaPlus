namespace QuickPharmaPlus.Server.ModelsDTO.Employee
{
    public class UpdateEmployeeDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public int? BranchId { get; set; }
        public int? CityId { get; set; }
        public string Block { get; set; } = string.Empty;
        public string Road { get; set; } = string.Empty;
        public string Building { get; set; } = string.Empty;
    }
}