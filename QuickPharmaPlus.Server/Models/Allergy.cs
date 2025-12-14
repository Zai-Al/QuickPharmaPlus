using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Allergy")]
[Index("AlleryTypeId", Name = "IXFK_Allergies_Allergy_Type")]
[Index("AlleryNameId", Name = "IXFK_Allergy_Allergy_name")]
[Index("SeverityId", Name = "IX_Allergy_Severity_id")]
public partial class Allergy
{
    [Key]
    [Column("Allergy_id")]
    public int AllergyId { get; set; }

    [Column("Allery_Type_id")]
    public int? AlleryTypeId { get; set; }

    [Column("Allery_name_id")]
    public int? AlleryNameId { get; set; }

    [Column("Severity_id")]
    public int? SeverityId { get; set; }

    [InverseProperty("Allergy")]
    public virtual ICollection<AllergyIngredientInteraction> AllergyIngredientInteractions { get; set; } = new List<AllergyIngredientInteraction>();

    [ForeignKey("AlleryNameId")]
    [InverseProperty("Allergies")]
    public virtual AllergyName? AlleryName { get; set; }

    [ForeignKey("AlleryTypeId")]
    [InverseProperty("Allergies")]
    public virtual AllergyType? AlleryType { get; set; }

    [InverseProperty("Allergy")]
    public virtual ICollection<HealthProfileAllergy> HealthProfileAllergies { get; set; } = new List<HealthProfileAllergy>();

    [ForeignKey("SeverityId")]
    [InverseProperty("Allergies")]
    public virtual Severity? Severity { get; set; }
}
