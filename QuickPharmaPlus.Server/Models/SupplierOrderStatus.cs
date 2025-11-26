using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Keyless]
[Table("Supplier_Order_Status")]
public partial class SupplierOrderStatus
{
    [Column("Product_Order_Status_id")]
    public int ProductOrderStatusId { get; set; }

    [Column("Product_Order_Status_Type")]
    [StringLength(100)]
    public string? ProductOrderStatusType { get; set; }
}
