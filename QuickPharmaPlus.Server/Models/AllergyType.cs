using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Allergy_Type")]
public partial class AllergyType
{
    [Key]
    [Column("Allery_Type_id")]
    public int AlleryTypeId { get; set; }

    [Column("Aller_Type_name")]
    [StringLength(300)]
    public string? AllerTypeName { get; set; }

    [InverseProperty("AlleryType")]
    public virtual ICollection<Allergy> Allergies { get; set; } = new List<Allergy>();
}
