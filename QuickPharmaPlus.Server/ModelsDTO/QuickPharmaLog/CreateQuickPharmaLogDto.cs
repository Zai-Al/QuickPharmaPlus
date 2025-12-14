namespace QuickPharmaPlus.Server.ModelsDTO.QuickPharmaLog
{
    public class CreateQuickPharmaLogDto
    {
        public string? LogDescription { get; set; }
        public int? LogTypeId { get; set; }
        public int? UserId { get; set; }
    }
}