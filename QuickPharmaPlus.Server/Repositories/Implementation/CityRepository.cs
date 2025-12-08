using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class CityRepository : ICityRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public CityRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<City>> GetAllCitiesAsync()
        {
            return await _context.Cities
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
