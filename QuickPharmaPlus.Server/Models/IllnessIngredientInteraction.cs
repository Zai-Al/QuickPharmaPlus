using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Illness_Ingredient_Interaction")]
[Index("IllnessId", "IngredientId", Name = "UQ_III", IsUnique = true)]
public partial class IllnessIngredientInteraction
{
    [Key]
    [Column("Illness_Ingredient_Interaction_id")]
    public int IllnessIngredientInteractionId { get; set; }

    [Column("Illness_id")]
    public int IllnessId { get; set; }

    [Column("Ingredient_id")]
    public int IngredientId { get; set; }

    [ForeignKey("IllnessId")]
    [InverseProperty("IllnessIngredientInteractions")]
    public virtual Illness Illness { get; set; } = null!;

    [ForeignKey("IngredientId")]
    [InverseProperty("IllnessIngredientInteractions")]
    public virtual Ingredient Ingredient { get; set; } = null!;
}
