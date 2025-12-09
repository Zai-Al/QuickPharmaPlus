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
            var query = _context.Users
                .Include(u => u.Branch)
                .Include(u => u.Role)
                .Include(u => u.Address).ThenInclude(a => a.City)
                .Where(u => u.RoleId == 1 || u.RoleId == 2 || u.RoleId == 3 || u.RoleId == 4)
                .AsQueryable();

            // Filters employees by name using starts-with matching
            if (!string.IsNullOrWhiteSpace(nameSearch))
            {
                var term = nameSearch.Trim().ToLower();

                query = query.Where(u =>
                    (u.FirstName ?? "").ToLower().StartsWith(term) ||
                    (u.LastName ?? "").ToLower().StartsWith(term) ||
                    (u.EmailAddress ?? "").ToLower().StartsWith(term)
                );
            }

            // Filters employees by exact ID match
            if (!string.IsNullOrWhiteSpace(idSearch))
            {
                var term = idSearch.Trim();
                query = query.Where(u => u.UserId.ToString() == term);
            }

            // Filters employees by role match
            if (!string.IsNullOrWhiteSpace(role))
            {
                var term = role.Trim().ToLower();
                query = query.Where(u => (u.Role.RoleName ?? "").ToLower() == term);
            }

            // Counts filtered results
            var filteredTotal = await query.CountAsync();

            // Retrieves filtered and paginated employee list
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
