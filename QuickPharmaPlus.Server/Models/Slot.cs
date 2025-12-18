using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Slot")]
[Index("SlotName", Name = "UQ__Slot__A888F6FB242923D6", IsUnique = true)]
public partial class Slot
{
    [Key]
    [Column("Slot_id")]
    public int SlotId { get; set; }

    [Column("Slot_name")]
    [StringLength(50)]
    public string SlotName { get; set; } = null!;

    [Column("Slot_start_time")]
    public TimeOnly? SlotStartTime { get; set; }

    [Column("Slot_end_time")]
    public TimeOnly? SlotEndTime { get; set; }

    [Column("Slot_description")]
    [StringLength(200)]
    public string? SlotDescription { get; set; }

    [InverseProperty("ShippingSlot")]
    public virtual ICollection<Shipping> Shippings { get; set; } = new List<Shipping>();

    [InverseProperty("Slot")]
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
