using System.Text.Json.Serialization;


namespace QuickPharmaPlus.Server.ModelsDTO.Auth
{
    public class ExternalProfileDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }

        [JsonPropertyName("phoneNumber")]
        public string? PhoneNumber { get; set; }

        public string? City { get; set; }
        public string? Block { get; set; }
        public string? Road { get; set; }
        public string? BuildingFloor { get; set; }
    }
}
