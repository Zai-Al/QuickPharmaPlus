namespace QuickPharmaPlus.Server.ModelsDTO.Prescription
{
    public class PrescriptionUpdateDto
    {
        public string? PrescriptionName { get; set; }
        public bool? IsHealthPerscription { get; set; }

        public int? CityId { get; set; }          
        public string? Block { get; set; }
        public string? Road { get; set; }         
        public string? BuildingFloor { get; set; }

        public IFormFile? PrescriptionDocument { get; set; }
        public IFormFile? PrescriptionCprDocument { get; set; }
    }
}
