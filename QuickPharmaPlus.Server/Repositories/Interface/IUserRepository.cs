using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IUserRepository
    {
        // Existing simple paging — keep it
        Task<PagedResult<User>> GetAllEmployeesAsync(int pageNumber, int pageSize);

        // NEW overload — enables backend filtering + dynamic pagination
        Task<PagedResult<User>> GetAllEmployeesAsync(
            int pageNumber,
            int pageSize,
            string? nameSearch,
            string? idSearch,
            string? role
        );

        Task<User?> GetEmployeeByIdAsync(int id);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User> AddEmployeeAsync(User user);
        Task<User?> UpdateEmployeeAsync(User user);
        Task<bool> DeleteEmployeeAsync(int id);
    }
}
