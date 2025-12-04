using QuickPharmaPlus.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IUserRepository
    {
        Task<IEnumerable<User>> GetAllEmployeesAsync();
        Task<User?> GetEmployeeByIdAsync(int id);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User> AddEmployeeAsync(User user);
        Task<User?> UpdateEmployeeAsync(User user);
        Task<bool> DeleteEmployeeAsync(int id);
    }
}
