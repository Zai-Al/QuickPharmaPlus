using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Supplier_Order")]
[Index("ProductId", Name = "IXFK_Supplier_Order_Product")]
[Index("SupplierId", Name = "IXFK_Supplier_Order_Supplier")]
[Index("SupplierOrderStatusId", Name = "IXFK_Supplier_Order_Supplier_Order_Status")]
[Index("EmployeeId", Name = "IXFK_Supplier_Order_User")]
public partial class SupplierOrder
{
    [Key]
    [Column("Supplier_Order_id")]
    public int SupplierOrderId { get; set; }

    [Column("Supplier_Order_date")]
    public DateTime? SupplierOrderDate { get; set; }

    [Column("Supplier_Order_quantity")]
    public int? SupplierOrderQuantity { get; set; }

    [Column("Supplier_Order_Status_id")]
    public int? SupplierOrderStatusId { get; set; }

    [Column("Supplier_id")]
    public int? SupplierId { get; set; }

    [Column("Employee_id")]
    public int? EmployeeId { get; set; }

    [Column("Product_id")]
    public int? ProductId { get; set; }

    [ForeignKey("EmployeeId")]
    [InverseProperty("SupplierOrders")]
    public virtual User? Employee { get; set; }

    [ForeignKey("ProductId")]
    [InverseProperty("SupplierOrders")]
    public virtual Product? Product { get; set; }

    [ForeignKey("SupplierId")]
    [InverseProperty("SupplierOrders")]
    public virtual Supplier? Supplier { get; set; }
}
