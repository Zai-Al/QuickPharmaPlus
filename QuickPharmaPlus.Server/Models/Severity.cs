using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Severity")]
[Index("SeverityName", Name = "UQ_Severity_Name", IsUnique = true)]
public partial class Severity
{
    [Key]
    [Column("Severity_id")]
    public int SeverityId { get; set; }

    [Column("Severity_name")]
    [StringLength(100)]
    public string SeverityName { get; set; } = null!;

    [InverseProperty("Severity")]
    public virtual ICollection<Allergy> Allergies { get; set; } = new List<Allergy>();

    [InverseProperty("Severity")]
    public virtual ICollection<HealthProfileAllergy> HealthProfileAllergies { get; set; } = new List<HealthProfileAllergy>();

    [InverseProperty("Severity")]
    public virtual ICollection<HealthProfileIllness> HealthProfileIllnesses { get; set; } = new List<HealthProfileIllness>();

    [InverseProperty("Severity")]
    public virtual ICollection<Illness> Illnesses { get; set; } = new List<Illness>();
}
