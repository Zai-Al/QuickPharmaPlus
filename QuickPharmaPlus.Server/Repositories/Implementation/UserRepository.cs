using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class UserRepository : IUserRepository
    {
        private readonly QuickPharmaPlusDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public UserRepository(QuickPharmaPlusDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // FETCH ALL EMPLOYEES
        public async Task<PagedResult<User>> GetAllEmployeesAsync(int pageNumber, int pageSize)
        {
            var query = _context.Users
                .Include(u => u.Branch)
                .Include(u => u.Role)
                .Include(u => u.Address)
                    .ThenInclude(a => a.City)
                .Where(u => u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3 || u.RoleId == 4);

            var totalCount = await query.CountAsync();

            var data = await query
                .OrderBy(u => u.UserId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<User>
            {
                Items = data,
                TotalCount = totalCount
            };
        }



        // FETCH SINGLE EMPLOYEE RECORD
        public async Task<User?> GetEmployeeByIdAsync(int id)
        {
            return await _context.Users
                .Include(u => u.Branch)
                .Include(u => u.Role)
                .Include(u => u.Address)
                    .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(u => u.UserId == id);
        }

        // FETCH USER BY EMAIL
        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users
                .Include(u => u.Branch)
                .Include(u => u.Role)
                .Include(u => u.Address)
                    .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(u => u.EmailAddress == email);
        }


        // ADD NEW EMPLOYEE
        public async Task<User> AddEmployeeAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        // EDIT EMPLOYEE RECORD
        // - preserve existing email when caller omits/clears it
        // - mirror intentional email change to Identity (if a matching ApplicationUser exists)
        // - preserve BranchId and RoleId when caller omits them (same semantics as email)
        public async Task<User?> UpdateEmployeeAsync(User employee)
        {
            var existing = await _context.Users
                .Include(u => u.Address)
                    .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(u => u.UserId == employee.UserId);

            if (existing == null)
                return null;

            // If caller supplied a non-empty new email and it's different, check uniqueness
            var incomingEmail = employee.EmailAddress?.Trim();
            var storedEmail = existing.EmailAddress?.Trim();

            if (!string.IsNullOrWhiteSpace(incomingEmail) &&
                !string.Equals(incomingEmail, storedEmail, StringComparison.OrdinalIgnoreCase))
            {
                var emailTaken = await _context.Users.AnyAsync(u =>
                    u.UserId != employee.UserId &&
                    u.EmailAddress != null &&
                    u.EmailAddress.Equals(incomingEmail, StringComparison.OrdinalIgnoreCase));

                if (emailTaken)
                    throw new InvalidOperationException("Email address is already in use by another account.");

                // Attempt to update the Identity user if one exists for the previous stored email.
                if (!string.IsNullOrWhiteSpace(storedEmail))
                {
                    var appUser = await _userManager.FindByEmailAsync(storedEmail);
                    if (appUser != null)
                    {
                        var setEmailResult = await _userManager.SetEmailAsync(appUser, incomingEmail);
                        var setUserNameResult = await _userManager.SetUserNameAsync(appUser, incomingEmail);

                        if (!setEmailResult.Succeeded || !setUserNameResult.Succeeded)
                        {
                            // aggregate errors for debugging; don't accidentally clear local email on Identity failure
                            var errors = string.Join("; ", setEmailResult.Errors.Select(e => e.Description)
                                .Concat(setUserNameResult.Errors.Select(e => e.Description)));
                            throw new InvalidOperationException("Failed to update identity email: " + errors);
                        }

                        var upd = await _userManager.UpdateAsync(appUser);
                        if (!upd.Succeeded)
                        {
                            var errors = string.Join("; ", upd.Errors.Select(e => e.Description));
                            throw new InvalidOperationException("Failed to update identity user: " + errors);
                        }
                    }
                }

                // Persist email change in application User table
                existing.EmailAddress = incomingEmail;
            }
            // If incoming email is null/empty: do NOT overwrite existing.EmailAddress (preserve it).

            // Update scalar fields (do not overwrite email with null/empty)
            existing.FirstName = employee.FirstName;
            existing.LastName = employee.LastName;
            existing.ContactNumber = employee.ContactNumber;

            // Preserve BranchId and RoleId unless caller explicitly provided non-null values (mirrors email semantics)
            if (employee.BranchId.HasValue && employee.BranchId != existing.BranchId)
            {
                existing.BranchId = employee.BranchId;
            }

            if (employee.RoleId.HasValue && employee.RoleId != existing.RoleId)
            {
                existing.RoleId = employee.RoleId;
            }

            // Handle nested address payload if provided (client may send employee.Address)
            if (employee.Address is not null)
            {
                var addrPayload = employee.Address;

                if (existing.AddressId.HasValue)
                {
                    // Update existing address record
                    var existingAddr = await _context.Addresses.FirstOrDefaultAsync(a => a.AddressId == existing.AddressId.Value);
                    if (existingAddr != null)
                    {
                        existingAddr.Street = addrPayload.Street;
                        existingAddr.Block = addrPayload.Block;
                        existingAddr.BuildingNumber = addrPayload.BuildingNumber;
                        existingAddr.CityId = addrPayload.CityId;
                    }
                    else
                    {
                        // If address id mismatch, create new address and assign
                        var newAddr = new Address
                        {
                            Street = addrPayload.Street,
                            Block = addrPayload.Block,
                            BuildingNumber = addrPayload.BuildingNumber,
                            CityId = addrPayload.CityId
                        };
                        _context.Addresses.Add(newAddr);
                        await _context.SaveChangesAsync();
                        existing.AddressId = newAddr.AddressId;
                    }
                }
                else
                {
                    // No existing address: create one
                    var newAddr = new Address
                    {
                        Street = addrPayload.Street,
                        Block = addrPayload.Block,
                        BuildingNumber = addrPayload.BuildingNumber,
                        CityId = addrPayload.CityId
                    };
                    _context.Addresses.Add(newAddr);
                    await _context.SaveChangesAsync();
                    existing.AddressId = newAddr.AddressId;
                }
            }
            else
            {
                // If no nested address provided, but the caller provided AddressId directly, accept it
                if (employee.AddressId != existing.AddressId)
                {
                    existing.AddressId = employee.AddressId;
                }
            }

            await _context.SaveChangesAsync();

            // Return the refreshed user including navigation properties
            return await GetEmployeeByIdAsync(existing.UserId);
        }

        // DELETE EMPLOYEE
        public async Task<bool> DeleteEmployeeAsync(int id)
        {
            // Load the user including AddressId
            var employee = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id);

            if (employee == null)
                return false;

            // If the user has an associated address, try to remove it
            if (employee.AddressId.HasValue)
            {
                var addressId = employee.AddressId.Value;

                // Attempt to fetch the address entity
                var address = await _context.Addresses.FirstOrDefaultAsync(a => a.AddressId == addressId);

                if (address != null)
                {
                    // Remove the address from the context
                    _context.Addresses.Remove(address);
                }
            }

            // Remove the user
            _context.Users.Remove(employee);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}