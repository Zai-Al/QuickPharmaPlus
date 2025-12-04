using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Interaction")]
[Index("IngredientAId", Name = "IXFK_Interaction_Ingredient")]
[Index("IngredientAId", Name = "IXFK_Interaction_Ingredient_02")]
[Index("InteractionTypeId", Name = "IXFK_Interaction_Interaction_Type")]
[Index("IngredientAId", "IngredientBId", Name = "UQ_IngredientPairs", IsUnique = true)]
public partial class Interaction
{
    [Key]
    [Column("Interaction_id")]
    public int InteractionId { get; set; }

    [Column("Interaction_description")]
    public string? InteractionDescription { get; set; }

    [Column("Interaction_Type_id")]
    public int? InteractionTypeId { get; set; }

    [Column("IngredientA_id")]
    public int? IngredientAId { get; set; }

    [Column("IngredientB_id")]
    public int? IngredientBId { get; set; }
}
