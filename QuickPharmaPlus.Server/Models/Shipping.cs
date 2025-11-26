using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Shipping")]
[Index("AddressId", Name = "IXFK_Shipping_Address")]
[Index("BranchId", Name = "IXFK_Shipping_Branch")]
[Index("UserId", Name = "IXFK_Shipping_User")]
public partial class Shipping
{
    [Key]
    [Column("Shipping_id")]
    public int ShippingId { get; set; }

    [Column("Shipping_isUrgent")]
    public bool? ShippingIsUrgent { get; set; }

    [Column("Shipping_date", TypeName = "datetime")]
    public DateTime? ShippingDate { get; set; }

    [Column("Shipping_slot")]
    [StringLength(200)]
    public string? ShippingSlot { get; set; }

    [Column("Shipping_isDelivery")]
    public bool? ShippingIsDelivery { get; set; }

    [Column("User_id")]
    public int? UserId { get; set; }

    [Column("address_id")]
    public int? AddressId { get; set; }

    [Column("Branch_id")]
    public int? BranchId { get; set; }

    [ForeignKey("AddressId")]
    [InverseProperty("Shippings")]
    public virtual Address? Address { get; set; }

    [ForeignKey("BranchId")]
    [InverseProperty("Shippings")]
    public virtual Branch? Branch { get; set; }

    [InverseProperty("Shipping")]
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    [InverseProperty("Shipping")]
    public virtual ICollection<PrescriptionPlan> PrescriptionPlans { get; set; } = new List<PrescriptionPlan>();

    [ForeignKey("UserId")]
    [InverseProperty("Shippings")]
    public virtual User? User { get; set; }
}
