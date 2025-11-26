using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Category")]
public partial class Category
{
    [Key]
    [Column("Category_id")]
    public int CategoryId { get; set; }

    [Column("Category_name")]
    [StringLength(200)]
    public string? CategoryName { get; set; }

    [Column("Category_image", TypeName = "image")]
    public byte[]? CategoryImage { get; set; }

    [InverseProperty("Category")]
    public virtual ICollection<ProductType> ProductTypes { get; set; } = new List<ProductType>();
}
