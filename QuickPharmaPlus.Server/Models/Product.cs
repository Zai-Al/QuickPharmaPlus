using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Product")]
[Index("ProductTypeId", Name = "IXFK_Product_Product_Type")]
[Index("SupplierId", Name = "IXFK_Product_Supplier")]
public partial class Product
{
    [Key]
    [Column("Product_id")]
    public int ProductId { get; set; }

    [Column("Product_name")]
    [StringLength(400)]
    public string? ProductName { get; set; }

    [Column("Product_description")]
    public string? ProductDescription { get; set; }

    [Column("Product_price", TypeName = "decimal(18, 3)")]
    public decimal? ProductPrice { get; set; }

    [Column("isControlled")]
    public bool? IsControlled { get; set; }

    [Column("Supplier_id")]
    public int? SupplierId { get; set; }

    [Column("Product_image")]
    public byte[]? ProductImage { get; set; }

    [Column("Product_Type_id")]
    public int? ProductTypeId { get; set; }

    [Column("Category_id")]
    public int CategoryId { get; set; }

    [InverseProperty("Product")]
    public virtual ICollection<Cart> Carts { get; set; } = new List<Cart>();

    [ForeignKey("CategoryId")]
    [InverseProperty("Products")]
    public virtual Category Category { get; set; } = null!;

    [InverseProperty("Product")]
    public virtual ICollection<IngredientProduct> IngredientProducts { get; set; } = new List<IngredientProduct>();

    [InverseProperty("Product")]
    public virtual ICollection<Inventory> Inventories { get; set; } = new List<Inventory>();

    [InverseProperty("Product")]
    public virtual ICollection<ProductOrder> ProductOrders { get; set; } = new List<ProductOrder>();

    [ForeignKey("ProductTypeId")]
    [InverseProperty("Products")]
    public virtual ProductType? ProductType { get; set; }

    [InverseProperty("Product")]
    public virtual ICollection<Reorder> Reorders { get; set; } = new List<Reorder>();

    [ForeignKey("SupplierId")]
    [InverseProperty("Products")]
    public virtual Supplier? Supplier { get; set; }

    [InverseProperty("Product")]
    public virtual ICollection<SupplierOrder> SupplierOrders { get; set; } = new List<SupplierOrder>();

    [InverseProperty("Product")]
    public virtual ICollection<WishList> WishLists { get; set; } = new List<WishList>();
}
