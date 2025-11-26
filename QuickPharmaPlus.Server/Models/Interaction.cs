using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Interaction")]
[Index("IngredientId", Name = "IXFK_Interaction_Ingredient")]
[Index("IngredientId", Name = "IXFK_Interaction_Ingredient_02")]
[Index("InteractionTypeId", Name = "IXFK_Interaction_Interaction_Type")]
public partial class Interaction
{
    [Key]
    [Column("Interaction_id")]
    public int InteractionId { get; set; }

    [Column("Interaction_description")]
    public string? InteractionDescription { get; set; }

    [Column("Interaction_Type_id")]
    public int? InteractionTypeId { get; set; }

    [Column("Ingredient_id")]
    public int? IngredientId { get; set; }

    [ForeignKey("IngredientId")]
    [InverseProperty("Interactions")]
    public virtual Ingredient? Ingredient { get; set; }

    [ForeignKey("InteractionTypeId")]
    [InverseProperty("Interactions")]
    public virtual InteractionType? InteractionType { get; set; }
}
