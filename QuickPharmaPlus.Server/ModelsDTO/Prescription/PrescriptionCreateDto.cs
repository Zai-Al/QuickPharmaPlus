namespace QuickPharmaPlus.Server.ModelsDTO.Prescription
{
    public class PrescriptionCreateDto
    {
        public string? PrescriptionName { get; set; }
        public bool? IsHealthPerscription { get; set; }

        public IFormFile? PrescriptionDocument { get; set; }
        public IFormFile? PrescriptionCprDocument { get; set; }
    }
}
