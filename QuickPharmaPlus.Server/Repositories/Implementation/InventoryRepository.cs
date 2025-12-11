using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Inventory;
using QuickPharmaPlus.Server.ModelsDTO.Address;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class InventoryRepository : IInventoryRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public InventoryRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<InventoryListDto>> GetAllInventoriesAsync(
            int pageNumber,
            int pageSize,
            string? search = null,
            DateOnly? expiryDate = null)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            var query = _context.Inventories
                .Include(i => i.Product)
                .Include(i => i.Branch)
                    .ThenInclude(b => b.Address)
                        .ThenInclude(a => a.City)
                .AsQueryable();

            // ============================================
            // SAFE SEARCH SANITIZATION
            // ============================================
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();

                // Reject dangerous characters
                // Allowed: letters, digits, space, - plus
                var validPattern = @"^[A-Za-z0-9+\- ]*$";
                if (!Regex.IsMatch(search, validPattern))
                {
                    // return empty result without throwing
                    return new PagedResult<InventoryListDto>
                    {
                        Items = new List<InventoryListDto>(),
                        TotalCount = 0
                    };
                }

                // Number means match InventoryId
                if (int.TryParse(search, out int idVal))
                {
                    query = query.Where(i => i.InventoryId == idVal);
                }
                else
                {
                    // Prefix product name matching (case insensitive)
                    var lower = search.ToLower();
                    query = query.Where(i =>
                        i.Product != null &&
                        (i.Product.ProductName ?? "")
                            .ToLower()
                            .StartsWith(lower)
                    );
                }
            }

            // ============================================
            // EXPIRY DATE FILTER (DateOnly safe comparison)
            // ============================================
            if (expiryDate.HasValue)
            {
                var dateFilter = expiryDate.Value;
                query = query.Where(i =>
                    i.InventoryExpiryDate.HasValue &&
                    i.InventoryExpiryDate.Value == dateFilter
                );
            }

            // COUNT AFTER FILTERS APPLIED
            var total = await query.CountAsync();

            // PAGE + MAP DTO
            var items = await query
                .OrderBy(i => i.InventoryId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(i => new InventoryListDto
                {
                    InventoryId = i.InventoryId,
                    ProductId = i.ProductId,
                    ProductName = i.Product != null ? i.Product.ProductName : null,
                    Quantity = i.InventoryQuantity ?? 0,
                    ExpiryDate = i.InventoryExpiryDate,
                    BranchId = i.BranchId,
                    Address = i.Branch != null && i.Branch.Address != null ? new AddressDto
                    {
                        AddressId = i.Branch.Address.AddressId,
                        Block = i.Branch.Address.Block,
                        Street = i.Branch.Address.Street,
                        BuildingNumber = i.Branch.Address.BuildingNumber,
                        City = i.Branch.Address.City != null ? new CityDto
                        {
                            CityId = i.Branch.Address.City.CityId,
                            CityName = i.Branch.Address.City.CityName
                        } : null
                    } : null
                })
                .ToListAsync();

            return new PagedResult<InventoryListDto>
            {
                Items = items,
                TotalCount = total
            };
        }

        public async Task<InventoryDetailDto?> GetInventoryByIdAsync(int id)
        {
            var inv = await _context.Inventories
                .Include(i => i.Product)
                .Include(i => i.Branch)
                    .ThenInclude(b => b.Address)
                        .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(i => i.InventoryId == id);

            if (inv == null) return null;

            return new InventoryDetailDto
            {
                InventoryId = inv.InventoryId,
                ProductId = inv.ProductId,
                ProductName = inv.Product?.ProductName,
                Quantity = inv.InventoryQuantity,
                ExpiryDate = inv.InventoryExpiryDate,
                BranchId = inv.BranchId,
                Address = inv.Branch?.Address != null ? new AddressDto
                {
                    AddressId = inv.Branch.Address.AddressId,
                    Block = inv.Branch.Address.Block,
                    Street = inv.Branch.Address.Street,
                    BuildingNumber = inv.Branch.Address.BuildingNumber,
                    City = inv.Branch.Address.City != null ? new CityDto
                    {
                        CityId = inv.Branch.Address.City.CityId,
                        CityName = inv.Branch.Address.City.CityName
                    } : null
                } : null
            };
        }

        public async Task<Inventory?> UpdateInventoryAsync(Inventory inventory)
        {
            var existing = await _context.Inventories.FirstOrDefaultAsync(i => i.InventoryId == inventory.InventoryId);
            if (existing == null) return null;

            existing.InventoryExpiryDate = inventory.InventoryExpiryDate;
            existing.InventoryQuantity = inventory.InventoryQuantity;
            existing.ProductId = inventory.ProductId;
            existing.BranchId = inventory.BranchId;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteInventoryAsync(int id)
        {
            var existing = await _context.Inventories.FirstOrDefaultAsync(i => i.InventoryId == id);
            if (existing == null) return false;

            _context.Inventories.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
