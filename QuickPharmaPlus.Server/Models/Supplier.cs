using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Supplier")]
[Index("AddressId", Name = "IXFK_Supplier_Address")]
public partial class Supplier
{
    [Key]
    [Column("Supplier_id")]
    public int SupplierId { get; set; }

    [Column("Supplier_name")]
    [StringLength(200)]
    public string? SupplierName { get; set; }

    [Column("Supplier_contact")]
    [StringLength(100)]
    public string? SupplierContact { get; set; }

    [Column("Supplier_email")]
    [StringLength(300)]
    public string? SupplierEmail { get; set; }

    [Column("Supplier_representative")]
    [StringLength(300)]
    public string? SupplierRepresentative { get; set; }

    [Column("address_id")]
    public int? AddressId { get; set; }

    [ForeignKey("AddressId")]
    [InverseProperty("Suppliers")]
    public virtual Address? Address { get; set; }

    [InverseProperty("Supplier")]
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    [InverseProperty("Supplier")]
    public virtual ICollection<Reorder> Reorders { get; set; } = new List<Reorder>();

    [InverseProperty("Supplier")]
    public virtual ICollection<SupplierOrder> SupplierOrders { get; set; } = new List<SupplierOrder>();
}
