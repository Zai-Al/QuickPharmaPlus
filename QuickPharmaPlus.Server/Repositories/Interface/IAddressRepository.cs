using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Address;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IAddressRepository
    {
        // Get address entity by id (includes City navigation).
        Task<Address?> GetByIdAsync(int id);

        // Get mapped AddressDto by id (includes CityDto).
        Task<AddressDto?> GetDtoByIdAsync(int id);

        // Create a new address and return the created address id.
        Task<int> CreateAsync(Address address);

        // Update an existing address. Returns true when updated, false when not found.
        Task<bool> UpdateAsync(Address address);

        // Delete address by id. Returns true when deleted, false when not found.
        Task<bool> DeleteAsync(int id);

        // Resolve a City entity by name (case-insensitive). Returns null when not found.
        Task<City?> ResolveCityByNameAsync(string? cityName);
    }
}
