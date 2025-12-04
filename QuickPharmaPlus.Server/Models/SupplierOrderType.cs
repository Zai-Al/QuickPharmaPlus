using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Supplier_Order_Type")]
public partial class SupplierOrderType
{
    [Key]
    [Column("Supplier_Order_Type_id")]
    public int SupplierOrderTypeId { get; set; }

    [Column("Supplier_Order_Type_name")]
    [StringLength(50)]
    public string SupplierOrderTypeName { get; set; } = null!;

    [InverseProperty("SupplierOrderType")]
    public virtual ICollection<SupplierOrder> SupplierOrders { get; set; } = new List<SupplierOrder>();
}
