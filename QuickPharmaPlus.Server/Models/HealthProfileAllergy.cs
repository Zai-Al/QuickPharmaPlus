using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Health_Profile_Allergy")]
[Index("AllergyId", Name = "IXFK_Health_Profile_Allergy_Allergy")]
[Index("HealthProfileId", Name = "IXFK_Health_Profile_Allergy_Health_Profile")]
public partial class HealthProfileAllergy
{
    [Key]
    [Column("Health_Profile_Allergy_id")]
    public int HealthProfileAllergyId { get; set; }

    [Column("Allergy_id")]
    public int? AllergyId { get; set; }

    [Column("Health_Profile_id")]
    public int? HealthProfileId { get; set; }

    [ForeignKey("AllergyId")]
    [InverseProperty("HealthProfileAllergies")]
    public virtual Allergy? Allergy { get; set; }

    [ForeignKey("HealthProfileId")]
    [InverseProperty("HealthProfileAllergies")]
    public virtual HealthProfile? HealthProfile { get; set; }
}
