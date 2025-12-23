namespace QuickPharmaPlus.Server.ModelsDTO.Prescription
{
    public class PrescriptionDetailsDto
    {
        // Prescription info
        public int PrescriptionId { get; set; }
        public string PrescriptionName { get; set; }
        public int PrescriptionStatusId { get; set; }
        public string PrescriptionStatusName { get; set; }
        public DateOnly PrescriptionCreationDate { get; set; }

        // Patient/User info
        public int UserId { get; set; }
        public string PatientFirstName { get; set; }
        public string PatientLastName { get; set; }
        public string PatientContactNumber { get; set; }
        public string PatientEmailAddress { get; set; }

        // Address info
        public int? AddressId { get; set; }
        public string CityName { get; set; }
        public string Block { get; set; }
        public string Road { get; set; }
        public string BuildingFloor { get; set; }

        // Product info
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public string ProductDescription { get; set; }
        public decimal? ProductPrice { get; set; }

        // Documents info
        public bool HasPrescriptionDocument { get; set; }
        public bool HasCprDocument { get; set; }
        public string PrescriptionDocumentContentType { get; set; }
        public string PrescriptionCprDocumentContentType { get; set; }
        public string PrescriptionFileName { get; set; }
        public string CprFileName { get; set; }
    }
}