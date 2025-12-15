namespace QuickPharmaPlus.Server.ModelsDTO.HealthProfile
{
    public class HealthProfileIllnessDto
    {
        public int HealthProfileIllnessId { get; set; }

        public int IllnessId { get; set; }

        public int IllnessNameId { get; set; }
        public string? IllnessName { get; set; }

        public int? IllnessTypeId { get; set; }
        public string? IllnessTypeName { get; set; }

        public int SeverityId { get; set; }
        public string? SeverityName { get; set; }
    }
}
