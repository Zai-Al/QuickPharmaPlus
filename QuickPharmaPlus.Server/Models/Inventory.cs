using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Inventory")]
[Index("BranchId", Name = "IXFK_Inventory_Branch")]
[Index("BranchId", Name = "IXFK_Inventory_Branch_02")]
[Index("ProductId", Name = "IXFK_Inventory_Product")]
public partial class Inventory
{
    [Key]
    [Column("Inventory_id")]
    public int InventoryId { get; set; }

    [Column("Inventory_expiry_date")]
    public DateOnly? InventoryExpiryDate { get; set; }

    [Column("Inventory_quantity")]
    public int? InventoryQuantity { get; set; }

    [Column("Product_id")]
    public int? ProductId { get; set; }

    [Column("Branch_id")]
    public int? BranchId { get; set; }

    [ForeignKey("BranchId")]
    [InverseProperty("Inventories")]
    public virtual Branch? Branch { get; set; }

    [ForeignKey("ProductId")]
    [InverseProperty("Inventories")]
    public virtual Product? Product { get; set; }

    [InverseProperty("Inventory")]
    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();
}
