using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Shipping_Type")]
public partial class ShippingType
{
    [Key]
    [Column("Shipping_Type_id")]
    public int ShippingTypeId { get; set; }

    [Column("Shipping_Type_name")]
    [StringLength(100)]
    [Unicode(false)]
    public string? ShippingTypeName { get; set; }
}
