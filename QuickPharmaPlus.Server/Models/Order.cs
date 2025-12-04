using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Order")]
[Index("OrderStatusId", Name = "IXFK_Order_Order_Status")]
[Index("PaymentId", Name = "IXFK_Order_Payment")]
[Index("ShippingId", Name = "IXFK_Order_Shipping")]
[Index("UserId", Name = "IXFK_Order_User")]
public partial class Order
{
    [Key]
    [Column("Order_id")]
    public int OrderId { get; set; }

    [Column("Order_Status_id")]
    public int? OrderStatusId { get; set; }

    [Column("Order_total")]
    public int? OrderTotal { get; set; }

    [Column("Payment_id")]
    public int? PaymentId { get; set; }

    [Column("User_id")]
    public int? UserId { get; set; }

    [Column("Shipping_id")]
    public int? ShippingId { get; set; }

    [ForeignKey("OrderStatusId")]
    [InverseProperty("Orders")]
    public virtual OrderStatus? OrderStatus { get; set; }

    [ForeignKey("PaymentId")]
    [InverseProperty("Orders")]
    public virtual Payment? Payment { get; set; }

    [InverseProperty("Order")]
    public virtual ICollection<ProductOrder> ProductOrders { get; set; } = new List<ProductOrder>();

    [InverseProperty("Order")]
    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();

    [ForeignKey("ShippingId")]
    [InverseProperty("Orders")]
    public virtual Shipping? Shipping { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("Orders")]
    public virtual User? User { get; set; }
}
