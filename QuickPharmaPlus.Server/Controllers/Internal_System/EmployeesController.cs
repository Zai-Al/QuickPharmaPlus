using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Address;
using QuickPharmaPlus.Server.ModelsDTO.Employee;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly IUserRepository _repo;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly QuickPharmaPlusDbContext _context;

        // VALIDATION PATTERNS MATCHING FRONTEND
        private static readonly Regex ValidNameRegex = new(@"^[A-Za-z .-]*$");
        private static readonly Regex ValidNumericRegex = new(@"^[0-9]*$");
        private static readonly Regex FirstNameRegex = new(@"^[A-Za-z\s.]+$");
        private static readonly Regex LastNameRegex = new(@"^[A-Za-z\s.-]+$");
        private static readonly Regex EmailRegex = new(@"^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
        private static readonly Regex PhoneRegex = new(@"^[0-9+\s-]{6,20}$");
        private static readonly Regex BlockRegex = new(@"^[0-9]+$");
        private static readonly Regex RoadBuildingRegex = new(@"^[A-Za-z0-9\s/.-]+$");

        public EmployeesController(
            IUserRepository repo,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            QuickPharmaPlusDbContext context)
        {
            _repo = repo;
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
        }

        // UPDATED: backend-side paging + filtering support with validation
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? nameSearch = null,
            [FromQuery] string? idSearch = null,
            [FromQuery] string? role = null,
            [FromQuery] int? branchId = null)
        {
            // Sanitize name search 
            if (!string.IsNullOrWhiteSpace(nameSearch))
            {
                nameSearch = nameSearch.Trim();

                if (!ValidNameRegex.IsMatch(nameSearch))
                {
                    return BadRequest(new { error = "Invalid name format — allowed: letters, space, dot, dash." });
                }
            }

            // Sanitize ID search to numeric only
            if (!string.IsNullOrWhiteSpace(idSearch))
            {
                idSearch = idSearch.Trim();

                if (!ValidNumericRegex.IsMatch(idSearch))
                {
                    return BadRequest(new { error = "Invalid ID format — only numbers allowed." });
                }
            }

            // Prevent meaningless paging
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            // FIXED: Now passing branchId to repository
            var result = await _repo.GetAllEmployeesAsync(
                pageNumber,
                pageSize,
                nameSearch,
                idSearch,
                role,
                branchId
            );

            // MAP TO DTO TO PREVENT CIRCULAR REFERENCES
            var dtoItems = result.Items.Select(u => new EmployeeDto
            {
                UserId = u.UserId,
                FirstName = u.FirstName,
                LastName = u.LastName,
                EmailAddress = u.EmailAddress,
                ContactNumber = u.ContactNumber,
                RoleName = u.Role?.RoleName,

                // Employee's personal address
                Address = u.Address != null ? new AddressDto
                {
                    AddressId = u.Address.AddressId,
                    Block = u.Address.Block,
                    Street = u.Address.Street,
                    BuildingNumber = u.Address.BuildingNumber,
                    City = u.Address.City != null ? new CityDto
                    {
                        CityId = u.Address.City.CityId,
                        CityName = u.Address.City.CityName
                    } : null
                } : null,

                // Branch city name
                BranchCity = u.Branch != null && u.Branch.Address != null && u.Branch.Address.City != null
                    ? u.Branch.Address.City.CityName
                    : null
            }).ToList();

            return Ok(new
            {
                items = dtoItems,
                totalCount = result.TotalCount,
                pageNumber,
                pageSize
            });
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            try
            {
                var employee = await _repo.GetEmployeeByIdAsync(id);
                if (employee == null) return NotFound(new { error = "Employee not found." });
                
                // MAP TO DTO TO PREVENT CIRCULAR REFERENCES
                var dto = new EmployeeDto
                {
                    UserId = employee.UserId,
                    FirstName = employee.FirstName,
                    LastName = employee.LastName,
                    EmailAddress = employee.EmailAddress,
                    ContactNumber = employee.ContactNumber,
                    RoleName = employee.Role?.RoleName,
                    BranchId = employee.BranchId,
                    
                    // Employee's personal address
                    Address = employee.Address != null ? new AddressDto
                    {
                        AddressId = employee.Address.AddressId,
                        Block = employee.Address.Block,
                        Street = employee.Address.Street,
                        BuildingNumber = employee.Address.BuildingNumber,
                        City = employee.Address.City != null ? new CityDto
                        {
                            CityId = employee.Address.City.CityId,
                            CityName = employee.Address.City.CityName
                        } : null
                    } : null,
                    
                    // Branch city name
                    BranchCity = employee.Branch != null && employee.Branch.Address != null && employee.Branch.Address.City != null
                        ? employee.Branch.Address.City.CityName
                        : null
                };
                
                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEmployeeDto dto)
        {
            if (dto == null)
                return BadRequest("Employee data is required.");

            // =================== VALIDATION ===================

            // First Name
            if (string.IsNullOrWhiteSpace(dto.FirstName))
                return BadRequest("First name is required.");
            if (dto.FirstName.Trim().Length < 3)
                return BadRequest("First name must be at least 3 letters.");
            if (!FirstNameRegex.IsMatch(dto.FirstName.Trim()))
                return BadRequest("First name can contain letters, spaces, and dots (.) only.");

            // Last Name
            if (string.IsNullOrWhiteSpace(dto.LastName))
                return BadRequest("Last name is required.");
            if (dto.LastName.Trim().Length < 3)
                return BadRequest("Last name must be at least 3 letters.");
            if (!LastNameRegex.IsMatch(dto.LastName.Trim()))
                return BadRequest("Last name can contain letters, spaces, dots (.), and dash (-) only.");

            // Role
            if (string.IsNullOrWhiteSpace(dto.Role))
                return BadRequest("Role must be selected.");

            var allowedRoles = new[] { "Admin", "Manager", "Pharmacist", "Driver" };
            if (!allowedRoles.Contains(dto.Role))
                return BadRequest("Invalid role selected.");

            // Branch
            if (!dto.BranchId.HasValue || dto.BranchId.Value <= 0)
                return BadRequest("Branch must be selected.");

            // Email
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Email is required.");
            if (!EmailRegex.IsMatch(dto.Email.Trim()))
                return BadRequest("Email must be valid (e.g., user@example.com).");

            // Check if email already exists
            var existingIdentityUser = await _userManager.FindByEmailAsync(dto.Email.Trim());
            if (existingIdentityUser != null)
                return BadRequest("An account with this email already exists.");

            // Password
            if (string.IsNullOrWhiteSpace(dto.TempPassword))
                return BadRequest("Password is required.");

            // Phone
            if (string.IsNullOrWhiteSpace(dto.Phone))
                return BadRequest("Phone number is required.");
            if (!PhoneRegex.IsMatch(dto.Phone.Trim()))
                return BadRequest("Phone number can only contain numbers, +, spaces, and dash (-), and must be 6-20 characters.");

            // City
            if (!dto.CityId.HasValue || dto.CityId.Value <= 0)
                return BadRequest("City must be selected.");

            // Block
            if (string.IsNullOrWhiteSpace(dto.Block))
                return BadRequest("Block is required.");
            if (!BlockRegex.IsMatch(dto.Block.Trim()))
                return BadRequest("Block must contain numbers only.");

            // Road
            if (string.IsNullOrWhiteSpace(dto.Road))
                return BadRequest("Road is required.");
            if (!RoadBuildingRegex.IsMatch(dto.Road.Trim()))
                return BadRequest("Road cannot contain special characters like @, #, $, *, etc.");

            // Building
            if (string.IsNullOrWhiteSpace(dto.Building))
                return BadRequest("Building is required.");
            if (!RoadBuildingRegex.IsMatch(dto.Building.Trim()))
                return BadRequest("Building cannot contain special characters like @, #, $, *, etc.");

            try
            {
                // =================== CREATE ADDRESS ===================
                var address = new Address
                {
                    CityId = dto.CityId.Value,
                    Block = dto.Block.Trim(),
                    Street = dto.Road.Trim(),
                    BuildingNumber = dto.Building.Trim()
                };

                _context.Addresses.Add(address);
                await _context.SaveChangesAsync();

                // =================== CREATE IDENTITY USER ===================
                var identityUser = new ApplicationUser
                {
                    UserName = dto.Email.Trim(),
                    Email = dto.Email.Trim(),
                    EmailConfirmed = true,
                    FirstName = dto.FirstName.Trim(),
                    LastName = dto.LastName.Trim(),
                    PhoneNumber = dto.Phone.Trim()
                };

                var createResult = await _userManager.CreateAsync(identityUser, dto.TempPassword);

                if (!createResult.Succeeded)
                {
                    var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                    return BadRequest($"Failed to create user account: {errors}");
                }

                // =================== ASSIGN ROLE IN IDENTITY ===================
                if (!await _roleManager.RoleExistsAsync(dto.Role))
                {
                    await _roleManager.CreateAsync(new IdentityRole(dto.Role));
                }

                await _userManager.AddToRoleAsync(identityUser, dto.Role);

                // =================== GET ROLE ID FROM DOMAIN TABLE ===================
                var domainRole = await _context.Roles
                    .FirstOrDefaultAsync(r => r.RoleName == dto.Role);

                if (domainRole == null)
                    return BadRequest("Role not found in system.");

                // =================== CREATE DOMAIN USER ===================
                var user = new User
                {
                    FirstName = dto.FirstName.Trim(),
                    LastName = dto.LastName.Trim(),
                    EmailAddress = dto.Email.Trim(),
                    ContactNumber = dto.Phone.Trim(),
                    AddressId = address.AddressId,
                    BranchId = dto.BranchId.Value,
                    RoleId = domainRole.RoleId
                };

                var created = await _repo.AddEmployeeAsync(user);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    userId = created.UserId,
                    message = "Employee added successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeeDto dto)
        {
            if (dto == null)
                return BadRequest("Employee data is required.");

            // =================== VALIDATION ===================
            
            // First Name
            if (string.IsNullOrWhiteSpace(dto.FirstName))
                return BadRequest("First name is required.");
            if (dto.FirstName.Trim().Length < 3)
                return BadRequest("First name must be at least 3 letters.");
            if (!FirstNameRegex.IsMatch(dto.FirstName.Trim()))
                return BadRequest("First name must contain letters only.");

            // Last Name
            if (string.IsNullOrWhiteSpace(dto.LastName))
                return BadRequest("Last name is required.");
            if (dto.LastName.Trim().Length < 3)
                return BadRequest("Last name must be at least 3 letters.");
            if (!LastNameRegex.IsMatch(dto.LastName.Trim()))
                return BadRequest("Last name can contain letters, spaces, dots (.), and dash (-) only.");

            // Role
            if (string.IsNullOrWhiteSpace(dto.Role))
                return BadRequest("Role must be selected.");

            var allowedRoles = new[] { "Admin", "Manager", "Pharmacist", "Driver" };
            if (!allowedRoles.Contains(dto.Role))
                return BadRequest("Invalid role selected.");

            // Branch
            if (!dto.BranchId.HasValue || dto.BranchId.Value <= 0)
                return BadRequest("Branch must be selected.");

            // Email
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Email is required.");
            if (!EmailRegex.IsMatch(dto.Email.Trim()))
                return BadRequest("Email must be valid (e.g., user@example.com).");

            // Phone
            if (string.IsNullOrWhiteSpace(dto.Phone))
                return BadRequest("Phone number is required.");
            if (!PhoneRegex.IsMatch(dto.Phone.Trim()))
                return BadRequest("Phone number must be exactly 8 digits.");

            // City
            if (!dto.CityId.HasValue || dto.CityId.Value <= 0)
                return BadRequest("City must be selected.");

            // Block
            if (string.IsNullOrWhiteSpace(dto.Block))
                return BadRequest("Block is required.");
            if (!BlockRegex.IsMatch(dto.Block.Trim()))
                return BadRequest("Block must contain numbers only.");

            // Road
            if (string.IsNullOrWhiteSpace(dto.Road))
                return BadRequest("Road is required.");
            if (!RoadBuildingRegex.IsMatch(dto.Road.Trim()))
                return BadRequest("Road cannot contain special characters like @, #, $, *, etc.");

            // Building
            if (string.IsNullOrWhiteSpace(dto.Building))
                return BadRequest("Building is required.");
            if (!RoadBuildingRegex.IsMatch(dto.Building.Trim()))
                return BadRequest("Building cannot contain special characters like @, #, $, *, etc.");

            try
            {
                // Get existing employee
                var existingEmployee = await _repo.GetEmployeeByIdAsync(id);
                if (existingEmployee == null)
                    return NotFound("Employee not found.");

                // Check email uniqueness (if changed)
                if (existingEmployee.EmailAddress != dto.Email.Trim())
                {
                    var existingIdentityUser = await _userManager.FindByEmailAsync(dto.Email.Trim());
                    if (existingIdentityUser != null)
                        return BadRequest("An account with this email already exists.");
                }

                // =================== UPDATE ADDRESS ===================
                if (existingEmployee.Address != null)
                {
                    existingEmployee.Address.CityId = dto.CityId.Value;
                    existingEmployee.Address.Block = dto.Block.Trim();
                    existingEmployee.Address.Street = dto.Road.Trim();
                    existingEmployee.Address.BuildingNumber = dto.Building.Trim();
                }
                else
                {
                    // Create new address if doesn't exist
                    var address = new Address
                    {
                        CityId = dto.CityId.Value,
                        Block = dto.Block.Trim(),
                        Street = dto.Road.Trim(),
                        BuildingNumber = dto.Building.Trim()
                    };
                    _context.Addresses.Add(address);
                    await _context.SaveChangesAsync();
                    existingEmployee.AddressId = address.AddressId;
                }

                // =================== UPDATE DOMAIN USER ===================
                existingEmployee.FirstName = dto.FirstName.Trim();
                existingEmployee.LastName = dto.LastName.Trim();
                existingEmployee.EmailAddress = dto.Email.Trim();
                existingEmployee.ContactNumber = dto.Phone.Trim();
                existingEmployee.BranchId = dto.BranchId.Value;

                // Update role if changed
                var domainRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == dto.Role);
                if (domainRole != null)
                {
                    existingEmployee.RoleId = domainRole.RoleId;
                }

                await _context.SaveChangesAsync();

                // =================== UPDATE IDENTITY USER ===================
                var identityUser = await _userManager.FindByEmailAsync(existingEmployee.EmailAddress);
                if (identityUser != null)
                {
                    identityUser.FirstName = dto.FirstName.Trim();
                    identityUser.LastName = dto.LastName.Trim();
                    identityUser.Email = dto.Email.Trim();
                    identityUser.UserName = dto.Email.Trim();
                    identityUser.PhoneNumber = dto.Phone.Trim();

                    var updateResult = await _userManager.UpdateAsync(identityUser);
                    if (!updateResult.Succeeded)
                    {
                        var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                        return BadRequest($"Failed to update user account: {errors}");
                    }

                    // Update role if changed
                    var currentRoles = await _userManager.GetRolesAsync(identityUser);
                    if (!currentRoles.Contains(dto.Role))
                    {
                        await _userManager.RemoveFromRolesAsync(identityUser, currentRoles);
                        
                        if (!await _roleManager.RoleExistsAsync(dto.Role))
                        {
                            await _roleManager.CreateAsync(new IdentityRole(dto.Role));
                        }
                        
                        await _userManager.AddToRoleAsync(identityUser, dto.Role);
                    }
                }

                return Ok(new { message = "Employee updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _repo.DeleteEmployeeAsync(id);
                return result ? Ok() : NotFound();
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An unexpected error occurred." });
            }
        }
    }
}