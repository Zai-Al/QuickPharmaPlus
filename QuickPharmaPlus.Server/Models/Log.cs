using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Log")]
public partial class Log
{
    [Key]
    [Column("Log_id")]
    public int LogId { get; set; }

    [Column("Log_description")]
    public string? LogDescription { get; set; }

    [Column("Log_timestamp", TypeName = "datetime")]
    public DateTime? LogTimestamp { get; set; }

    [Column("Log_Type_id")]
    public int? LogTypeId { get; set; }

    [Column("User_id")]
    public int? UserId { get; set; }

    [ForeignKey("LogTypeId")]
    [InverseProperty("Logs")]
    public virtual LogType? LogType { get; set; }
}
