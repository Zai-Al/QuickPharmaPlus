using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Reorder")]
[Index("ProductId", Name = "IXFK_Reorder_Product")]
[Index("SupplierId", Name = "IXFK_Reorder_Supplier")]
[Index("UserId", Name = "IXFK_Reorder_User")]
public partial class Reorder
{
    [Key]
    [Column("Reorder_id")]
    public int ReorderId { get; set; }

    [Column("Reorder_thershold")]
    public int? ReorderThershold { get; set; }

    [Column("Product_id")]
    public int? ProductId { get; set; }

    [Column("Supplier_id")]
    public int? SupplierId { get; set; }

    [Column("User_id")]
    public int? UserId { get; set; }

    [ForeignKey("ProductId")]
    [InverseProperty("Reorders")]
    public virtual Product? Product { get; set; }

    [ForeignKey("SupplierId")]
    [InverseProperty("Reorders")]
    public virtual Supplier? Supplier { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("Reorders")]
    public virtual User? User { get; set; }
}
