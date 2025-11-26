using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Payment_Method")]
public partial class PaymentMethod
{
    [Key]
    [Column("Payment_Method_id")]
    public int PaymentMethodId { get; set; }

    [Column("Payment_Method_name")]
    [StringLength(200)]
    public string? PaymentMethodName { get; set; }

    [InverseProperty("PaymentMethod")]
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
