using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Illness_Name")]
public partial class IllnessName
{
    [Key]
    [Column("Illness_Name_id")]
    public int IllnessNameId { get; set; }

    [Column("Illness_Name")]
    [StringLength(300)]
    public string? IllnessName1 { get; set; }

    [InverseProperty("IllnessName")]
    public virtual ICollection<Illness> Illnesses { get; set; } = new List<Illness>();
}
