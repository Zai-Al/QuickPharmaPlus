namespace QuickPharmaPlus.Server.ModelsDTO.Prescription
{
    public class PrescriptionListDto
    {
        public int PrescriptionId { get; set; }

        public int? PaientId { get; set; }
        public string? PatientName { get; set; }

        public int? BranchId { get; set; }
        public string? BranchName { get; set; }

        public string? PrescriptionName { get; set; }

        public int? PrescriptionStatusId { get; set; }
        public string? PrescriptionStatusName { get; set; }

        public DateOnly? PrescriptionCreationDate { get; set; }

        public bool? IsHealthPerscription { get; set; }

        public bool HasPrescriptionDocument { get; set; }
        public bool HasCprDocument { get; set; }

        public DateOnly? LatestApprovalExpiryDate { get; set; }

        public int? AddressId { get; set; }
        public int? CityId { get; set; }
        public string? CityName { get; set; }
        public string? Block { get; set; }
        public string? Road { get; set; }
        public string? BuildingFloor { get; set; }

        public string? PrescriptionDocumentContentType { get; set; }
        public string? PrescriptionCprDocumentContentType { get; set; }
        public string? PrescriptionFileName { get; set; }
        public string? CprFileName { get; set; }

        public string? ProductNames { get; set; }

        public int? RequestedQuantity { get; set; }
    }
}
