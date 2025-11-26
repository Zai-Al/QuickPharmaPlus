using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Allergy_Name")]
public partial class AllergyName
{
    [Key]
    [Column("Allery_Name_id")]
    public int AlleryNameId { get; set; }

    [Column("Allergy_Name")]
    [StringLength(300)]
    public string? AllergyName1 { get; set; }

    [InverseProperty("AlleryName")]
    public virtual ICollection<Allergy> Allergies { get; set; } = new List<Allergy>();
}
