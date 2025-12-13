using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Branch;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class BranchRepository : IBranchRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public BranchRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        // =============================================================
        // PAGED + FILTERED BRANCH LIST (supports ID and text filtering)
        // =============================================================
        public async Task<PagedResult<BranchListDto>> GetAllBranchesAsync(
            int pageNumber,
            int pageSize,
            string? search = null)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            // Base query (need Address + City for searching + display)
            var query = _context.Branches
                .Include(b => b.Address)
                    .ThenInclude(a => a.City)
                .AsQueryable();

            // 🔍 Apply filtering (same logic style as Category)
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                bool isNumericId = int.TryParse(term, out int idValue);

                if (isNumericId)
                {
                    query = query.Where(b => b.BranchId == idValue);
                }
                else
                {
                    // starts-with like Category (not contains)
                    query = query.Where(b =>
                        (b.Address != null && b.Address.City != null &&
                         b.Address.City.CityName != null &&
                         b.Address.City.CityName.ToLower().StartsWith(term))
                        ||
                        (b.Address != null && b.Address.Block != null &&
                         b.Address.Block.ToLower().StartsWith(term))
                        ||
                        (b.Address != null && b.Address.Street != null &&
                         b.Address.Street.ToLower().StartsWith(term))
                        ||
                        (b.Address != null && b.Address.BuildingNumber != null &&
                         b.Address.BuildingNumber.ToLower().StartsWith(term))
                    );
                }
            }

            // Count AFTER filtering
            var filteredCount = await query.CountAsync();

            // Apply paging + map projection
            var items = await query
                .OrderBy(b => b.BranchId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new BranchListDto
                {
                    BranchId = b.BranchId,
                    AddressId = b.AddressId,
                    CityName = b.Address != null && b.Address.City != null ? b.Address.City.CityName : null,
                    Block = b.Address != null ? b.Address.Block : null,
                    Street = b.Address != null ? b.Address.Street : null,
                    BuildingNumber = b.Address != null ? b.Address.BuildingNumber : null,
                })
                .ToListAsync();

            return new PagedResult<BranchListDto>
            {
                Items = items,
                TotalCount = filteredCount
            };
        }
    }
}
