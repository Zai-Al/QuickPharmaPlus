using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Illness")]
[Index("IllnessNameId", Name = "IXFK_Illness_Illness_Name")]
[Index("LllnessTypeId", Name = "IXFK_Illness_Illness_Type")]
public partial class Illness
{
    [Key]
    [Column("Illness_id")]
    public int IllnessId { get; set; }

    [Column("lllness_Type_id")]
    public int? LllnessTypeId { get; set; }

    [Column("Illness_Name_id")]
    public int? IllnessNameId { get; set; }

    [InverseProperty("Illness")]
    public virtual ICollection<HealthProfileIllness> HealthProfileIllnesses { get; set; } = new List<HealthProfileIllness>();

    [InverseProperty("Illness")]
    public virtual ICollection<IllnessIngredientInteraction> IllnessIngredientInteractions { get; set; } = new List<IllnessIngredientInteraction>();

    [ForeignKey("IllnessNameId")]
    [InverseProperty("Illnesses")]
    public virtual IllnessName? IllnessName { get; set; }

    [ForeignKey("LllnessTypeId")]
    [InverseProperty("Illnesses")]
    public virtual IllnessType? LllnessType { get; set; }
}
