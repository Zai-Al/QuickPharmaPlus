using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Reorder;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class ReorderRepository : IReorderRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        // Validation patterns (matching frontend standards)
        private static readonly Regex ValidIdPattern = new(@"^[0-9]*$");
        private static readonly Regex ValidNamePattern = new(@"^[A-Za-z0-9 .\-+]*$");

        public ReorderRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        // =============================================================
        // PAGED + FILTERED REORDER LIST
        // =============================================================
        public async Task<PagedResult<ReorderListDto>> GetAllReordersAsync(
            int pageNumber,
            int pageSize,
            string? search = null)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            // Base query including Branch → Address → City
            var query = _context.Reorders
                .Include(r => r.Product)
                .Include(r => r.Supplier)
                .Include(r => r.User)
                .Include(r => r.Branch)
                    .ThenInclude(b => b.Address)
                        .ThenInclude(a => a.City)
                .AsQueryable();

            // =============================================================
            // SAFE SEARCH SANITIZATION
            // =============================================================
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();

                // Validate search input
                bool validName = ValidNamePattern.IsMatch(search);
                bool validId = ValidIdPattern.IsMatch(search);

                if (!validName && !validId)
                {
                    // Return empty result for invalid input
                    return new PagedResult<ReorderListDto>
                    {
                        Items = new List<ReorderListDto>(),
                        TotalCount = 0
                    };
                }

                // ID exact match
                if (int.TryParse(search, out int idVal))
                {
                    query = query.Where(r => r.ReorderId == idVal);
                }
                else
                {
                    // Name search (product name, supplier name, or user name)
                    var lower = search.ToLower();
                    query = query.Where(r =>
                        (r.Product != null && (r.Product.ProductName ?? "").ToLower().StartsWith(lower)) ||
                        (r.Supplier != null && (r.Supplier.SupplierName ?? "").ToLower().StartsWith(lower)) ||
                        (r.User != null &&
                            ((r.User.FirstName ?? "") + " " + (r.User.LastName ?? "")).ToLower().StartsWith(lower))
                    );
                }
            }

            // Count AFTER filtering
            var total = await query.CountAsync();

            // Apply paging + projection
            var items = await query
                .OrderBy(r => r.ReorderId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new ReorderListDto
                {
                    ReorderId = r.ReorderId,
                    ReorderThreshold = r.ReorderThershold,
                    ProductId = r.ProductId,
                    ProductName = r.Product != null ? r.Product.ProductName : null,
                    SupplierId = r.SupplierId,
                    SupplierName = r.Supplier != null ? r.Supplier.SupplierName : null,
                    UserId = r.UserId,
                    UserFullName = r.User != null
                        ? (r.User.FirstName ?? "") + " " + (r.User.LastName ?? "")
                        : null,
                    BranchId = r.BranchId,
                    BranchName = r.Branch != null && r.Branch.Address != null && r.Branch.Address.City != null
                        ? r.Branch.Address.City.CityName
                        : null
                })
                .ToListAsync();

            return new PagedResult<ReorderListDto>
            {
                Items = items,
                TotalCount = total
            };
        }

        // =============================================================
        // GET REORDER DETAILS BY ID
        // =============================================================
        public async Task<ReorderDetailDto?> GetReorderByIdAsync(int id)
        {
            var reorder = await _context.Reorders
                .Include(r => r.Product)
                .Include(r => r.Supplier)
                .Include(r => r.User)
                .Include(r => r.Branch)
                    .ThenInclude(b => b.Address)
                        .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(r => r.ReorderId == id);

            if (reorder == null) return null;

            return new ReorderDetailDto
            {
                ReorderId = reorder.ReorderId,
                ReorderThreshold = reorder.ReorderThershold,
                ProductId = reorder.ProductId,
                ProductName = reorder.Product?.ProductName,
                ProductDescription = reorder.Product?.ProductDescription,
                SupplierId = reorder.SupplierId,
                SupplierName = reorder.Supplier?.SupplierName,
                SupplierContact = reorder.Supplier?.SupplierContact,
                SupplierEmail = reorder.Supplier?.SupplierEmail,
                UserId = reorder.UserId,
                UserFullName = reorder.User != null
                    ? (reorder.User.FirstName ?? "") + " " + (reorder.User.LastName ?? "")
                    : null,
                UserEmail = reorder.User?.EmailAddress,
                BranchId = reorder.BranchId,
                BranchName = reorder.Branch?.Address?.City?.CityName
            };
        }

        // =============================================================
        // CREATE NEW REORDER
        // =============================================================
        public async Task<Reorder> AddReorderAsync(Reorder reorder)
        {
            _context.Reorders.Add(reorder);
            await _context.SaveChangesAsync();
            return reorder;
        }

        // =============================================================
        // UPDATE EXISTING REORDER
        // =============================================================
        public async Task<Reorder?> UpdateReorderAsync(Reorder reorder)
        {
            var existing = await _context.Reorders
                .FirstOrDefaultAsync(r => r.ReorderId == reorder.ReorderId);

            if (existing == null) return null;

            existing.ReorderThershold = reorder.ReorderThershold;
            existing.ProductId = reorder.ProductId;
            existing.SupplierId = reorder.SupplierId;
            existing.UserId = reorder.UserId;
            existing.BranchId = reorder.BranchId;

            await _context.SaveChangesAsync();
            return existing;
        }

        // =============================================================
        // DELETE REORDER
        // =============================================================
        public async Task<bool> DeleteReorderAsync(int id)
        {
            var existing = await _context.Reorders
                .FirstOrDefaultAsync(r => r.ReorderId == id);

            if (existing == null) return false;

            _context.Reorders.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}