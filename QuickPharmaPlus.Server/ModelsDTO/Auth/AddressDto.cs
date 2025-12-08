namespace QuickPharmaPlus.Server.ModelsDTO.Auth
{
    public class AddressDto
    {
        public int? AddressId { get; set; }
        public string? Street { get; set; }
        public string? Block { get; set; }
        public string? BuildingNumber { get; set; }
        public string? City { get; set; } // City name
    }
}
