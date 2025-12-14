namespace QuickPharmaPlus.Server.ModelsDTO.Employee
{
    public class EmployeeDto
    {
        public int UserId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? EmailAddress { get; set; }
        public string? ContactNumber { get; set; }
        public string? RoleName { get; set; }
        
        // Address info (flat structure to avoid circular references)
        public string? City { get; set; }
        public string? Block { get; set; }
        public string? Street { get; set; }
        public string? BuildingNumber { get; set; }
    }
}
