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

        // Retrieves paged list of employees (no filtering applied)
        public async Task<PagedResult<User>> GetAllEmployeesAsync(int pageNumber, int pageSize)
        {
            return await GetAllEmployeesAsync(pageNumber, pageSize, null, null, null);
        }

        // Retrieves paged list of employees with backend filtering logic applied
        public async Task<PagedResult<User>> GetAllEmployeesAsync(
            int pageNumber,
            int pageSize,
            string? nameSearch,
            string? idSearch,
            string? role
        )
        {
            // Base query - unchanged
            var query = _context.Users
                .Include(u => u.Branch)
                .Include(u => u.Role)
                .Include(u => u.Address).ThenInclude(a => a.City)
                .Where(u => u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3 || u.RoleId == 4)
                .AsQueryable();

            // ---------- VALIDATION MATCHING FRONT-END RULES ----------

            // Validate name allowed characters (letters, space, dot ., dash -)
            if (!string.IsNullOrWhiteSpace(nameSearch))
            {
                nameSearch = nameSearch.Trim();

                // If invalid format, ignore filter instead of breaking query
                if (System.Text.RegularExpressions.Regex.IsMatch(nameSearch, @"^[A-Za-z .-]+$"))
                {
                    var term = nameSearch.ToLower();

                    query = query.Where(u =>
                        (u.FirstName ?? "").ToLower().StartsWith(term) ||
                        (u.LastName ?? "").ToLower().StartsWith(term) ||
                        (u.EmailAddress ?? "").ToLower().StartsWith(term)
                    );
                }
            }

            // Validate numeric ID filter (digits only)
            if (!string.IsNullOrWhiteSpace(idSearch))
            {
                idSearch = idSearch.Trim();

                if (System.Text.RegularExpressions.Regex.IsMatch(idSearch, @"^[0-9]+$"))
                {
                    query = query.Where(u => u.UserId.ToString() == idSearch);
                }
            }

            // Filters employees by role name
            if (!string.IsNullOrWhiteSpace(role))
            {
                var term = role.Trim().ToLower();
                query = query.Where(u => (u.Role.RoleName ?? "").ToLower() == term);
            }

            var filteredTotal = await query.CountAsync();

            var result = await query
                .OrderBy(u => u.UserId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<User>
            {
                Items = result,
                TotalCount = filteredTotal
            };
        }


        // Retrieves an employee record by its unique ID
        public async Task<User?> GetEmployeeByIdAsync(int id) =>
            await _context.Users
                .Include(u => u.Address).ThenInclude(a => a.City)
                .Include(u => u.Role)
                .Include(u => u.Branch)
                .FirstOrDefaultAsync(u => u.UserId == id);

        // Retrieves a user record based on email address value
        public async Task<User?> GetUserByEmailAsync(string email) =>
            await _context.Users
                .Include(u => u.Branch)
                .Include(u => u.Role)
                .Include(u => u.Address)
                    .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(u => u.EmailAddress == email);

        // Inserts a new employee record into the database
        public async Task<User> AddEmployeeAsync(User user) =>
            (await _context.Users.AddAsync(user)).Entity;

        // Inserts a new customer record into the database
        public async Task<User> AddCustomerAsync(User user)
        {
            // If RoleId not set, resolve "Customer" from Role table
            if (user.RoleId == 0)
            {
                var customerRole = await _context.Roles
                    .FirstOrDefaultAsync(r => r.RoleName == "Customer");

                if (customerRole != null)
                {
                    user.RoleId = customerRole.RoleId;
                }
                else
                {
                    // Fallback to 5 if lookup fails
                    user.RoleId = 5;
                }
            }

            var entry = await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();   // commit so User_id (IDENTITY) is generated
            return entry.Entity;
        }

        // Updates an existing employee record
        public async Task<User?> UpdateEmployeeAsync(User user)
        {
            var existing = await _context.Users.FindAsync(user.UserId);
            if (existing == null) return null;

            _context.Entry(existing).CurrentValues.SetValues(user);
            return existing;
        }

        // Deletes an employee record based on its ID
        public async Task<bool> DeleteEmployeeAsync(int id)
        {
            var existing = await _context.Users.FindAsync(id);
            if (existing == null) return false;

            _context.Users.Remove(existing);
            return true;
        }
    }
}
