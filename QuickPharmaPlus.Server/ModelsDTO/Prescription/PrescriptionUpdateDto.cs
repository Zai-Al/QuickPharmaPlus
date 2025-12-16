namespace QuickPharmaPlus.Server.ModelsDTO.Prescription
{
    public class PrescriptionUpdateDto
    {
        public string? PrescriptionName { get; set; }
        public bool? IsHealthPerscription { get; set; }

        // customer can re-upload
        public IFormFile? PrescriptionDocument { get; set; }
        public IFormFile? PrescriptionCprDocument { get; set; }
    }
}
