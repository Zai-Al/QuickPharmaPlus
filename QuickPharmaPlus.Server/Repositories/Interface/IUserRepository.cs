using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IUserRepository
    {
        Task<PagedResult<User>> GetAllEmployeesAsync(int pageNumber, int pageSize);

        Task<PagedResult<User>> GetAllEmployeesAsync(
            int pageNumber,
            int pageSize,
            string? nameSearch,
            string? idSearch,
            string? role,
            int? branchId = null 
        );
        
        Task<User> AddCustomerAsync(User user);
        Task<User?> GetEmployeeByIdAsync(int id);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User> AddEmployeeAsync(User user);
        Task<User?> UpdateEmployeeAsync(User user);
        Task<bool> DeleteEmployeeAsync(int id);
    }
}
