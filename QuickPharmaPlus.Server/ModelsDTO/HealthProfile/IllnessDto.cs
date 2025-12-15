namespace QuickPharmaPlus.Server.ModelsDTO.HealthProfile
{
    public class IllnessNameOptionDto
    {
        public int IllnessNameId { get; set; }
        public string IllnessName { get; set; } = string.Empty;
        public string IllnessTypeName { get; set; } = string.Empty;
    }

    public class SeverityOptionDto
    {
        public int SeverityId { get; set; }
        public string SeverityName { get; set; } = string.Empty;
    }
}
