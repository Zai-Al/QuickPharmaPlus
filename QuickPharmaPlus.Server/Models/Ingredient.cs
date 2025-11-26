using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Ingredient")]
public partial class Ingredient
{
    [Key]
    [Column("Ingredient_id")]
    public int IngredientId { get; set; }

    [Column("Ingredient_name")]
    [StringLength(300)]
    public string? IngredientName { get; set; }

    [InverseProperty("Ingredient")]
    public virtual ICollection<IngredientProduct> IngredientProducts { get; set; } = new List<IngredientProduct>();

    [InverseProperty("Ingredient")]
    public virtual ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();
}
