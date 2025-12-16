using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("User")]
[Index("AddressId", Name = "IXFK_User_Address")]
[Index("BranchId", Name = "IXFK_User_Branch")]
[Index("RoleId", Name = "IXFK_User_Role")]
public partial class User
{
    [Column("first_name")]
    [StringLength(200)]
    public string? FirstName { get; set; }

    [Column("last_name")]
    [StringLength(200)]
    public string? LastName { get; set; }

    [Key]
    [Column("User_id")]
    public int UserId { get; set; }

    [Column("contact_number")]
    [StringLength(100)]
    public string? ContactNumber { get; set; }

    [Column("email_address")]
    [StringLength(200)]
    public string? EmailAddress { get; set; }

    [Column("address_id")]
    public int? AddressId { get; set; }

    [Column("Role_id")]
    public int? RoleId { get; set; }

    [Column("Branch_id")]
    public int? BranchId { get; set; }

    [Column("Slot_id")]
    public int? SlotId { get; set; }

    [ForeignKey("AddressId")]
    [InverseProperty("Users")]
    public virtual Address? Address { get; set; }

    [InverseProperty("User")]
    public virtual ICollection<Approval> Approvals { get; set; } = new List<Approval>();

    [ForeignKey("BranchId")]
    [InverseProperty("Users")]
    public virtual Branch? Branch { get; set; }

    [InverseProperty("User")]
    public virtual ICollection<Branch> Branches { get; set; } = new List<Branch>();

    [InverseProperty("User")]
    public virtual ICollection<Cart> Carts { get; set; } = new List<Cart>();

    [InverseProperty("User")]
    public virtual ICollection<HealthProfile> HealthProfiles { get; set; } = new List<HealthProfile>();

    [InverseProperty("User")]
    public virtual ICollection<Log> Logs { get; set; } = new List<Log>();

    [InverseProperty("User")]
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    [InverseProperty("User")]
    public virtual ICollection<PrescriptionPlan> PrescriptionPlans { get; set; } = new List<PrescriptionPlan>();

    [InverseProperty("User")]
    public virtual ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();

    [InverseProperty("User")]
    public virtual ICollection<Reorder> Reorders { get; set; } = new List<Reorder>();

    [ForeignKey("RoleId")]
    [InverseProperty("Users")]
    public virtual Role? Role { get; set; }

    [InverseProperty("User")]
    public virtual ICollection<Shipping> Shippings { get; set; } = new List<Shipping>();

    [ForeignKey("SlotId")]
    [InverseProperty("Users")]
    public virtual Slot? Slot { get; set; }

    [InverseProperty("Employee")]
    public virtual ICollection<SupplierOrder> SupplierOrders { get; set; } = new List<SupplierOrder>();

    [InverseProperty("User")]
    public virtual ICollection<WishList> WishLists { get; set; } = new List<WishList>();
}
