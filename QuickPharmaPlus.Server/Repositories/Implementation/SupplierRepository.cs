using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Supplier;
using QuickPharmaPlus.Server.Repositories.Interface;
using QuickPharmaPlus.Server.ModelsDTO.Address;
namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class SupplierRepository : ISupplierRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public SupplierRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        // GET ALL SUPPLIERS (paged, searchable by id or name)
        public async Task<PagedResult<SupplierListDto>> GetAllSuppliersAsync(int pageNumber, int pageSize, string? search = null)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            var query = _context.Suppliers.AsQueryable();

            // Apply search: numeric -> match ID, otherwise name starts-with
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                if (int.TryParse(term, out int idVal))
                {
                    query = query.Where(s => s.SupplierId == idVal);
                }
                else
                {
                    var lower = term.ToLower();
                    query = query.Where(s => (s.SupplierName ?? "").ToLower().StartsWith(lower));
                }
            }

            var filteredCount = await query.CountAsync();

            var items = await query
                .Include(s => s.Address)
                    .ThenInclude(a => a.City)
                .OrderBy(s => s.SupplierId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new SupplierListDto
                {
                    SupplierId = s.SupplierId,
                    SupplierName = s.SupplierName,
                    Representative = s.SupplierRepresentative,
                    Contact = s.SupplierContact,
                    Email = s.SupplierEmail,

                    // FULL OBJECT MAPPING — NOT STRING ANYMORE
                    Address = s.Address != null ? new AddressDto
                    {
                        AddressId = s.Address.AddressId,
                        Block = s.Address.Block,
                        Street = s.Address.Street,
                        BuildingNumber = s.Address.BuildingNumber,

                        City = s.Address.City != null ? new CityDto
                        {
                            CityId = s.Address.City.CityId,
                            CityName = s.Address.City.CityName
                        } : null
                    } : null,

                    ProductCount = _context.Products.Count(p => p.SupplierId == s.SupplierId)
                })
                .ToListAsync();

            return new PagedResult<SupplierListDto>
            {
                Items = items,
                TotalCount = filteredCount
            };
        }

        // GET SUPPLIER DETAILS BY ID (includes address + city)
        public async Task<Supplier?> GetSupplierByIdAsync(int id)
        {
            return await _context.Suppliers
                .Include(s => s.Address)
                    .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(s => s.SupplierId == id);
        }

        // CREATE NEW SUPPLIER
        public async Task<Supplier> AddSupplierAsync(Supplier supplier)
        {
            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();
            return supplier;
        }

        // UPDATE EXISTING SUPPLIER
        public async Task<Supplier?> UpdateSupplierAsync(Supplier supplier)
        {
            var existing = await _context.Suppliers.FirstOrDefaultAsync(s => s.SupplierId == supplier.SupplierId);
            if (existing == null) return null;

            existing.SupplierName = supplier.SupplierName;
            existing.SupplierContact = supplier.SupplierContact;
            existing.SupplierEmail = supplier.SupplierEmail;
            existing.SupplierRepresentative = supplier.SupplierRepresentative;
            existing.AddressId = supplier.AddressId;

            await _context.SaveChangesAsync();
            return existing;
        }

        // DELETE SUPPLIER: remove orders/reorders and detach products, then remove supplier
        public async Task<bool> DeleteSupplierAsync(int id)
        {
            var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.SupplierId == id);
            if (supplier == null)
                return false;

            var relatedOrders = _context.SupplierOrders.Where(so => so.SupplierId == id);
            _context.SupplierOrders.RemoveRange(relatedOrders);

            var relatedReorders = _context.Reorders.Where(r => r.SupplierId == id);
            _context.Reorders.RemoveRange(relatedReorders);

            // Detach supplier from products (set SupplierId = null) to preserve products
            var products = _context.Products.Where(p => p.SupplierId == id);
            await products.ForEachAsync(p => p.SupplierId = null);

            _context.Suppliers.Remove(supplier);

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
