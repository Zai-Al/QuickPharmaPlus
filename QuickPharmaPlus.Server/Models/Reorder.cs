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
[Index("BranchId", Name = "IX_Reorder_Branch_id")]
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

    [Column("Branch_id")]
    public int BranchId { get; set; }

    [Column("Reorder_quantity")]
    public int? ReorderQuantity { get; set; }

    [ForeignKey("BranchId")]
    [InverseProperty("Reorders")]
    public virtual Branch Branch { get; set; } = null!;

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
