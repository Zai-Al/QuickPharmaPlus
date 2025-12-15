namespace QuickPharmaPlus.Server.ModelsDTO.HealthProfile
{
    public class HealthProfileAllergyDto
    {
        public int HealthProfileAllergyId { get; set; }

        public int AllergyId { get; set; }

        public int AllergyNameId { get; set; }
        public string AllergyName { get; set; } = string.Empty;

        public int AllergyTypeId { get; set; }
        public string AllergyTypeName { get; set; } = string.Empty;

        public int SeverityId { get; set; }
        public string SeverityName { get; set; } = string.Empty;
    }
}
