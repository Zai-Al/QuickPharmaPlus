namespace QuickPharmaPlus.Server.ModelsDTO.Report;

public sealed class ReportDetailsDto
{
    public int ReportId { get; set; }
    public string? ReportName { get; set; }
    public string? ReportDescription { get; set; }

    public int? ReportTypeId { get; set; }
    public string? ReportTypeName { get; set; }

    public DateTime ReportCreationTimestamp { get; set; }

    public int? GeneratedByUserId { get; set; }
    public string? GeneratedByName { get; set; }
    public string? GeneratedByEmail { get; set; }

    public string? FileName { get; set; }
    public string? ContentType { get; set; }
    public int? DocumentSizeBytes { get; set; }
}