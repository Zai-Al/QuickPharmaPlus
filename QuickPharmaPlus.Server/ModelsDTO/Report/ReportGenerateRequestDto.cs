namespace QuickPharmaPlus.Server.ModelsDTO.Report
{
    public sealed class ReportGenerateRequestDto
    {
        public string? ReportType { get; set; }

        // null = all branches (matches your frontend)
        public string? Branch { get; set; }

        // "YYYY-MM-DD" for now (matches your current React payload)
        public string? DateFrom { get; set; }
        public string? DateTo { get; set; }

        public string? ProductCategory { get; set; }
        public string? Supplier { get; set; }
        public string? Product { get; set; }
    }
}