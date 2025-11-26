using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Product_Order_Status")]
public partial class ProductOrderStatus
{
    [Key]
    [Column("Product_Order_Status_id")]
    public int ProductOrderStatusId { get; set; }

    [Column("Product_Order_Status_name")]
    public string? ProductOrderStatusName { get; set; }

    [InverseProperty("ProductOrderStatus")]
    public virtual ICollection<ProductOrder> ProductOrders { get; set; } = new List<ProductOrder>();
}
