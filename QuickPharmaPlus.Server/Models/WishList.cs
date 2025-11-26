using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Wish_List")]
[Index("ProductId", Name = "IXFK_Wish_List_Product")]
[Index("UserId", Name = "IXFK_Wish_List_User")]
public partial class WishList
{
    [Key]
    [Column("Wish_List_id")]
    public int WishListId { get; set; }

    [Column("User_id")]
    public int? UserId { get; set; }

    [Column("Product_id")]
    public int? ProductId { get; set; }

    [ForeignKey("ProductId")]
    [InverseProperty("WishLists")]
    public virtual Product? Product { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("WishLists")]
    public virtual User? User { get; set; }
}
