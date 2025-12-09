using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class RoleRepository : IRoleRepository
    {
        private readonly RoleManager<IdentityRole> _roleManager;

        public RoleRepository(RoleManager<IdentityRole> roleManager)
        {
            _roleManager = roleManager;
        }

        public async Task<IEnumerable<RoleDto>> GetAllRolesAsync()
        {
            // Only return roles that represent employees (roles 1..4 in your domain):
            // Admin, Manager, Pharmacist, Driver
            var allowed = new[] { "Admin", "Manager", "Pharmacist", "Driver" };

            return await _roleManager.Roles
                .AsNoTracking()
                .Where(r => allowed.Contains(r.Name))
                .Select(r => new RoleDto { Id = r.Id, Name = r.Name ?? string.Empty })
                .ToListAsync();
        }
    }
}
