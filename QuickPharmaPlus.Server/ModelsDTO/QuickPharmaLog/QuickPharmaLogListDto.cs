namespace QuickPharmaPlus.Server.ModelsDTO.QuickPharmaLog
{
    public class QuickPharmaLogListDto
    {
        public int LogId { get; set; }
        public string? LogTypeName { get; set; }
        public string? LogDescription { get; set; }
        public DateTime? LogTimestamp { get; set; }
        public string? EmployeeName { get; set; }
    }
}