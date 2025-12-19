using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Address;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class AddressRepository : IAddressRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public AddressRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        // Get address entity by id (includes City navigation).
        public async Task<Address?> GetByIdAsync(int id)
        {
            return await _context.Addresses
                .Include(a => a.City)
                .FirstOrDefaultAsync(a => a.AddressId == id);
        }

        // Get mapped AddressDto by id (includes CityDto).
        public async Task<AddressDto?> GetDtoByIdAsync(int id)
        {
            var addr = await _context.Addresses
                .Include(a => a.City)
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AddressId == id);

            if (addr == null) return null;

            return new AddressDto
            {
                AddressId = addr.AddressId,
                Block = addr.Block,
                Street = addr.Street,
                BuildingNumber = addr.BuildingNumber,
                City = addr.City != null ? new CityDto
                {
                    CityId = addr.City.CityId,
                    CityName = addr.City.CityName
                } : null
            };
        }

        // Create a new address and return the created address id.
        public async Task<int> CreateAsync(Address address)
        {
            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();
            return address.AddressId;
        }

        // Update an existing address. Returns true when updated, false when not found.
        public async Task<bool> UpdateAsync(Address address)
        {
            var existing = await _context.Addresses.FirstOrDefaultAsync(a => a.AddressId == address.AddressId);
            if (existing == null) return false;

            existing.Street = address.Street;
            existing.Block = address.Block;
            existing.BuildingNumber = address.BuildingNumber;
            existing.CityId = address.CityId;

            await _context.SaveChangesAsync();
            return true;
        }

        // Delete address by id. Returns true when deleted, false when not found.
        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _context.Addresses.FirstOrDefaultAsync(a => a.AddressId == id);
            if (existing == null) return false;

            _context.Addresses.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }

        // Resolve a City entity by name (case-insensitive). Returns null when not found.
        public async Task<City?> ResolveCityByNameAsync(string? cityName)
        {
            if (string.IsNullOrWhiteSpace(cityName)) return null;

            var term = cityName.Trim().ToLower();
            return await _context.Cities
                .FirstOrDefaultAsync(c => c.CityName != null && c.CityName.ToLower() == term);
        }

        public async Task<AddressDto?> GetProfileAddressByUserIdAsync(int userId)
        {
            if (userId <= 0) return null;

            // Step 1: SELECT address_id FROM [User] WHERE user_id = @userId
            var addressId = await _context.Users
                .Where(u => u.UserId == userId)
                .Select(u => u.AddressId)
                .FirstOrDefaultAsync();

            if (!addressId.HasValue || addressId.Value <= 0)
                return null;

            // Step 2: SELECT * FROM Address JOIN City WHERE address_id = @addressId
            var addr = await _context.Addresses
                .Include(a => a.City)
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AddressId == addressId.Value);

            if (addr == null) return null;

            // Map to AddressDto (same style as your existing GetDtoByIdAsync)
            return new AddressDto
            {
                AddressId = addr.AddressId,
                Block = addr.Block,
                Street = addr.Street,
                BuildingNumber = addr.BuildingNumber,
                City = addr.City == null ? null : new CityDto
                {
                    CityId = addr.City.CityId,
                    CityName = addr.City.CityName
                }
            };
        }


    }
}
