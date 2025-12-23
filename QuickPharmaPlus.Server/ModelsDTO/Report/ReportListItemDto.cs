namespace QuickPharmaPlus.Server.ModelsDTO.Report
{
    public class ReportListItemDto
    {
        public int ReportId { get; set; }
        public string? ReportName { get; set; }
        public int? ReportTypeId { get; set; }
        public string? ReportTypeName { get; set; }
        public DateTime ReportCreationTimestamp { get; set; }

        public string? FileName { get; set; }
        public string? ContentType { get; set; }
        public int? DocumentSizeBytes { get; set; }
    }
}