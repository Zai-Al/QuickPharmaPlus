using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Ingredient_Product")]
[Index("IngredientId", Name = "IXFK_Ingredient_Product_Ingredient")]
[Index("ProductId", Name = "IXFK_Ingredient_Product_Product")]
public partial class IngredientProduct
{
    [Key]
    [Column("Ingredient_product_id")]
    public int IngredientProductId { get; set; }

    [Column("Ingredient_id")]
    public int? IngredientId { get; set; }

    [Column("Product_id")]
    public int? ProductId { get; set; }

    [ForeignKey("IngredientId")]
    [InverseProperty("IngredientProducts")]
    public virtual Ingredient? Ingredient { get; set; }

    [ForeignKey("ProductId")]
    [InverseProperty("IngredientProducts")]
    public virtual Product? Product { get; set; }
}
