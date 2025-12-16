using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Address")]
[Index("CityId", Name = "IXFK_Address_City")]
public partial class Address
{
    [Key]
    [Column("address_id")]
    public int AddressId { get; set; }

    [Column("street")]
    [StringLength(100)]
    public string? Street { get; set; }

    [Column("block")]
    [StringLength(100)]
    public string? Block { get; set; }

    [Column("building_number")]
    [StringLength(300)]
    public string? BuildingNumber { get; set; }

    [Column("City_id")]
    public int? CityId { get; set; }

    [Column("isProfileAdress")]
    public bool? IsProfileAdress { get; set; }

    [InverseProperty("Address")]
    public virtual ICollection<Branch> Branches { get; set; } = new List<Branch>();

    [ForeignKey("CityId")]
    [InverseProperty("Addresses")]
    public virtual City? City { get; set; }

    [InverseProperty("Address")]
    public virtual ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();

    [InverseProperty("Address")]
    public virtual ICollection<Shipping> Shippings { get; set; } = new List<Shipping>();

    [InverseProperty("Address")]
    public virtual ICollection<Supplier> Suppliers { get; set; } = new List<Supplier>();

    [InverseProperty("Address")]
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
