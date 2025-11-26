using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Cart")]
[Index("ProductId", Name = "IXFK_Cart_Product")]
[Index("UserId", Name = "IXFK_Cart_User")]
public partial class Cart
{
    [Key]
    [Column("Cart_item_id")]
    public int CartItemId { get; set; }

    [Column("Cart_item_quantity")]
    public int? CartItemQuantity { get; set; }

    [Column("Product_id")]
    public int? ProductId { get; set; }

    [Column("User_id")]
    public int? UserId { get; set; }

    [ForeignKey("ProductId")]
    [InverseProperty("Carts")]
    public virtual Product? Product { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("Carts")]
    public virtual User? User { get; set; }
}
