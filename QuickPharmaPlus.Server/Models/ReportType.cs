using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Report_Type")]
public partial class ReportType
{
    [Key]
    [Column("Report_Type_id")]
    public int ReportTypeId { get; set; }

    [Column("Report_Type_name")]
    [StringLength(600)]
    public string? ReportTypeName { get; set; }

    [InverseProperty("ReportType")]
    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();
}
