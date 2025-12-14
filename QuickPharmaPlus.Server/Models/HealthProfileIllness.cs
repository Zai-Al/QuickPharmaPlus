using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Health_Profile_Illness")]
[Index("HealthProfileId", Name = "IXFK_Health_Profile_Illness_Health_Profile")]
[Index("IllnessId", Name = "IXFK_Health_Profile_Illness_Illness")]
public partial class HealthProfileIllness
{
    [Key]
    [Column("Health_Profile_Illness_id")]
    public int HealthProfileIllnessId { get; set; }

    [Column("Illness_id")]
    public int? IllnessId { get; set; }

    [Column("Health_Profile_id")]
    public int? HealthProfileId { get; set; }

    [Column("Severity_id")]
    public int? SeverityId { get; set; }

    [ForeignKey("HealthProfileId")]
    [InverseProperty("HealthProfileIllnesses")]
    public virtual HealthProfile? HealthProfile { get; set; }

    [ForeignKey("IllnessId")]
    [InverseProperty("HealthProfileIllnesses")]
    public virtual Illness? Illness { get; set; }

    [ForeignKey("SeverityId")]
    [InverseProperty("HealthProfileIllnesses")]
    public virtual Severity? Severity { get; set; }
}
