using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class UserRepository : IUserRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public UserRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        // FETCH ALL EMPLOYEES
        public async Task<IEnumerable<User>> GetAllEmployeesAsync()
        {
            return await _context.Users
                .Include(u => u.Branch)
                .Include(u => u.Role)
                .Include(u => u.Address)
                .ToListAsync();
        }

        // FETCH SINGLE EMPLOYEE RECORD
        public async Task<User?> GetEmployeeByIdAsync(int id)
        {
            return await _context.Users
                .Include(u => u.Branch)
                .Include(u => u.Role)
                .Include(u => u.Address)
                .FirstOrDefaultAsync(u => u.UserId == id);
        }

        // FETCH USER BY EMAIL
        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users
                .Include(u => u.Branch)
                .Include(u => u.Role)
                .Include(u => u.Address)
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
        public async Task<User?> UpdateEmployeeAsync(User employee)
        {
            var existing = await _context.Users.FirstOrDefaultAsync(u => u.UserId == employee.UserId);

            if (existing == null)
                return null;

            existing.FirstName = employee.FirstName;
            existing.LastName = employee.LastName;
            existing.EmailAddress = employee.EmailAddress;
            existing.ContactNumber = employee.ContactNumber;
            existing.BranchId = employee.BranchId;
            existing.RoleId = employee.RoleId;
            existing.AddressId = employee.AddressId;

            await _context.SaveChangesAsync();
            return existing;
        }

        // DELETE EMPLOYEE
        public async Task<bool> DeleteEmployeeAsync(int id)
        {
            var employee = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id);

            if (employee == null)
                return false;

            _context.Users.Remove(employee);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
