using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Allergy_Ingredient_Interaction")]
[Index("AllergyId", "IngredientId", Name = "UQ_AII", IsUnique = true)]
public partial class AllergyIngredientInteraction
{
    [Key]
    [Column("Allergy_Ingredient_Interaction_id")]
    public int AllergyIngredientInteractionId { get; set; }

    [Column("Allergy_id")]
    public int AllergyId { get; set; }

    [Column("Ingredient_id")]
    public int IngredientId { get; set; }

    [ForeignKey("AllergyId")]
    [InverseProperty("AllergyIngredientInteractions")]
    public virtual Allergy Allergy { get; set; } = null!;

    [ForeignKey("IngredientId")]
    [InverseProperty("AllergyIngredientInteractions")]
    public virtual Ingredient Ingredient { get; set; } = null!;
}
