using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Log")]
[Index("InventoryId", Name = "IXFK_Log_Inventory")]
[Index("OrderId", Name = "IXFK_Log_Order")]
public partial class Log
{
    [Key]
    [Column("Log_id")]
    public int LogId { get; set; }

    [Column("Log_description")]
    public string? LogDescription { get; set; }

    [Column("Order_id")]
    public int? OrderId { get; set; }

    [Column("Inventory_id")]
    public int? InventoryId { get; set; }

    [Column("Log_timestamp", TypeName = "datetime")]
    public DateTime? LogTimestamp { get; set; }

    [ForeignKey("InventoryId")]
    [InverseProperty("Logs")]
    public virtual Inventory? Inventory { get; set; }

    [ForeignKey("OrderId")]
    [InverseProperty("Logs")]
    public virtual Order? Order { get; set; }

    [InverseProperty("Log")]
    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();
}
