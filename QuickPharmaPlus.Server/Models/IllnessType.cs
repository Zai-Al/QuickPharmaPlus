using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Illness_Type")]
public partial class IllnessType
{
    [Key]
    [Column("lllness_Type_id")]
    public int LllnessTypeId { get; set; }

    [Column("Illness_Type_name")]
    [StringLength(300)]
    public string? IllnessTypeName { get; set; }

    [InverseProperty("LllnessType")]
    public virtual ICollection<Illness> Illnesses { get; set; } = new List<Illness>();
}
