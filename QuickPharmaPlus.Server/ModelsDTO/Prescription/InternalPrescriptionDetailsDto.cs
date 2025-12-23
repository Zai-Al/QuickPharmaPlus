namespace QuickPharmaPlus.Server.ModelsDTO.Prescription
{
    public class InternalPrescriptionDetailsDto
    {
        public int PrescriptionId { get; set; }
        public int? UserId { get; set; }

        public string? PrescriptionName { get; set; }
        public int? PrescriptionStatusId { get; set; }
        public string? PrescriptionStatusName { get; set; }
        public DateOnly? PrescriptionCreationDate { get; set; }

        // Patient details
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? ContactNumber { get; set; }

        // Address (prefer prescription address; if missing, fallback to user's profile address if exists)
        public string? CityName { get; set; }
        public string? Block { get; set; }
        public string? Road { get; set; }
        public string? BuildingFloor { get; set; }

        // Documents metadata (for UI enabling/disabling + naming)
        public bool HasPrescriptionDocument { get; set; }
        public bool HasCprDocument { get; set; }
        public string? PrescriptionFileName { get; set; }
        public string? CprFileName { get; set; }
    }
}