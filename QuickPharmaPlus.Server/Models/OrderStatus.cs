using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Order_Status")]
public partial class OrderStatus
{
    [Key]
    [Column("Order_Status_id")]
    public int OrderStatusId { get; set; }

    [Column("Order_Status_name")]
    [StringLength(200)]
    public string? OrderStatusName { get; set; }

    [InverseProperty("OrderStatus")]
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
