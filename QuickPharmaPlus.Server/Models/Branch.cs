using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Branch")]
[Index("AddressId", Name = "IXFK_Branch_Address")]
[Index("UserId", Name = "IXFK_Branch_User")]
public partial class Branch
{
    [Key]
    [Column("Branch_id")]
    public int BranchId { get; set; }

    [Column("address_id")]
    public int? AddressId { get; set; }

    [Column("User_id")]
    public int? UserId { get; set; }

    [ForeignKey("AddressId")]
    [InverseProperty("Branches")]
    public virtual Address? Address { get; set; }

    [InverseProperty("Branch")]
    public virtual ICollection<City> Cities { get; set; } = new List<City>();

    [InverseProperty("Branch")]
    public virtual ICollection<Inventory> Inventories { get; set; } = new List<Inventory>();

    [InverseProperty("Branch")]
    public virtual ICollection<Shipping> Shippings { get; set; } = new List<Shipping>();

    [ForeignKey("UserId")]
    [InverseProperty("Branches")]
    public virtual User? User { get; set; }

    [InverseProperty("Branch")]
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
