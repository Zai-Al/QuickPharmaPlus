using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Health_Profile")]
[Index("UserId", Name = "IXFK_Health_Profile_User")]
public partial class HealthProfile
{
    [Key]
    [Column("Health_Profile_id")]
    public int HealthProfileId { get; set; }

    [Column("User_id")]
    public int? UserId { get; set; }

    [InverseProperty("HealthProfile")]
    public virtual ICollection<HealthProfileAllergy> HealthProfileAllergies { get; set; } = new List<HealthProfileAllergy>();

    [InverseProperty("HealthProfile")]
    public virtual ICollection<HealthProfileIllness> HealthProfileIllnesses { get; set; } = new List<HealthProfileIllness>();

    [ForeignKey("UserId")]
    [InverseProperty("HealthProfiles")]
    public virtual User? User { get; set; }
}
