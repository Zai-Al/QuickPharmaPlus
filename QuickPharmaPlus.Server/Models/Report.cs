using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Report")]
[Index("InventoryId", Name = "IXFK_Report_Inventory")]
[Index("LogId", Name = "IXFK_Report_Log")]
[Index("OrderId", Name = "IXFK_Report_Order")]
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

    [Column("Log_id")]
    public int? LogId { get; set; }

    [Column("Inventory_id")]
    public int? InventoryId { get; set; }

    [Column("Order_id")]
    public int? OrderId { get; set; }

    [Column("Report_document")]
    public byte[]? ReportDocument { get; set; }

    [Column("Report_Type_id")]
    public int? ReportTypeId { get; set; }

    [ForeignKey("InventoryId")]
    [InverseProperty("Reports")]
    public virtual Inventory? Inventory { get; set; }

    [ForeignKey("LogId")]
    [InverseProperty("Reports")]
    public virtual Log? Log { get; set; }

    [ForeignKey("OrderId")]
    [InverseProperty("Reports")]
    public virtual Order? Order { get; set; }

    [ForeignKey("ReportTypeId")]
    [InverseProperty("Reports")]
    public virtual ReportType? ReportType { get; set; }
}
