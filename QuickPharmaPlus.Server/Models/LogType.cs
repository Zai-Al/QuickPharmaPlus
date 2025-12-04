using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Log_Type")]
public partial class LogType
{
    [Key]
    [Column("Log_Type_id")]
    public int LogTypeId { get; set; }

    [Column("Log_Type_name")]
    [StringLength(100)]
    public string LogTypeName { get; set; } = null!;

    [InverseProperty("LogType")]
    public virtual ICollection<Log> Logs { get; set; } = new List<Log>();
}
