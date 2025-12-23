using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Report")]
[Index("ReportTypeId", Name = "IXFK_Report_Report_Type")]
public partial class Report
{
    [Key]
    [Column("Report_id")]
    public int ReportId { get; set; }

    [Column("Report_description")]
    public string? ReportDescription { get; set; }

    [Column("Report_name")]
    public string? ReportName { get; set; }

    [Column("Report_document")]
    public byte[]? ReportDocument { get; set; }

    [Column("Report_Type_id")]
    public int? ReportTypeId { get; set; }

    [Column("Report_creation_timestamp")]
    public DateTime ReportCreationTimestamp { get; set; }

    [Column("User_id")]
    public int? UserId { get; set; }

    [Column("File_name")]
    [StringLength(260)]
    public string? FileName { get; set; }

    [Column("Content_type")]
    [StringLength(100)]
    public string? ContentType { get; set; }

    [Column("Document_size_bytes")]
    public int? DocumentSizeBytes { get; set; }
}
