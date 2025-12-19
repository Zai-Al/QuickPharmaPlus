using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Product_Order")]
[Index("OrderId", Name = "IXFK_Product_Order_Order")]
[Index("PrescriptionId", Name = "IXFK_Product_Order_Prescription")]
[Index("ProductId", Name = "IXFK_Product_Order_Product")]
public partial class ProductOrder
{
    [Key]
    [Column("Product_Order_id")]
    public int ProductOrderId { get; set; }

    [Column("Order_id")]
    public int? OrderId { get; set; }

    [Column("Product_id")]
    public int? ProductId { get; set; }

    [Column("Prescription_id")]
    public int? PrescriptionId { get; set; }

    [ForeignKey("OrderId")]
    [InverseProperty("ProductOrders")]
    public virtual Order? Order { get; set; }

    [ForeignKey("PrescriptionId")]
    [InverseProperty("ProductOrders")]
    public virtual Prescription? Prescription { get; set; }

    [ForeignKey("ProductId")]
    [InverseProperty("ProductOrders")]
    public virtual Product? Product { get; set; }
}
