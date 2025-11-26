using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Product_Type")]
[Index("CategoryId", Name = "IXFK_Product_Type_Category")]
public partial class ProductType
{
    [Key]
    [Column("Product_Type_id")]
    public int ProductTypeId { get; set; }

    [Column("Product_Type_name")]
    [StringLength(150)]
    public string? ProductTypeName { get; set; }

    [Column("Category_id")]
    public int? CategoryId { get; set; }

    [ForeignKey("CategoryId")]
    [InverseProperty("ProductTypes")]
    public virtual Category? Category { get; set; }

    [InverseProperty("ProductType")]
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
