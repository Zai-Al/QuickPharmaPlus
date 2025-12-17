using QuickPharmaPlus.Server.ModelsDTO.Address;

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
        
        // NEW: Branch ID for editing
        public int? BranchId { get; set; }
        
        // Employee's personal address
        public AddressDto? Address { get; set; }
        
        // Branch city name for display
        public string? BranchCity { get; set; }
    }
}
