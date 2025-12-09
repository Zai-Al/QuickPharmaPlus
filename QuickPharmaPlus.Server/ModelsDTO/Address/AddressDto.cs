using QuickPharmaPlus.Server.ModelsDTO; // required for CityDto

namespace QuickPharmaPlus.Server.ModelsDTO.Address
{
    public class AddressDto
    {
        public int AddressId { get; set; }
        public string? Block { get; set; }
        public string? Street { get; set; }
        public string? BuildingNumber { get; set; }

        // CHANGE THIS — Convert to CityDto instead of string
        public CityDto? City { get; set; }
    }
}
