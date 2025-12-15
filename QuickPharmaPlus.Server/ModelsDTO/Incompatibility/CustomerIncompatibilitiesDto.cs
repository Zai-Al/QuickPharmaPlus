namespace QuickPharmaPlus.Server.ModelsDTO.Incompatibility
{
    public class CustomerIncompatibilitiesDto
    {
        public List<MedicationConflictDto> Medications { get; set; } = new();
        public List<string> Allergies { get; set; } = new();
        public List<string> Illnesses { get; set; } = new();
    }

    public class MedicationConflictDto
    {
        public int OtherProductId { get; set; }
        public string OtherProductName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
