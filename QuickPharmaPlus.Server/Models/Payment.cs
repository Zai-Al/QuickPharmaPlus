using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Payment")]
[Index("PaymentMethodId", Name = "IXFK_Payment_Payment_Method")]
public partial class Payment
{
    [Key]
    [Column("Payment_id")]
    public int PaymentId { get; set; }

    [Column("Payment_timestamp")]
    public DateTime? PaymentTimestamp { get; set; }

    [Column("Payment_amount")]
    public int? PaymentAmount { get; set; }

    [Column("Payment_isSuccessful")]
    public bool? PaymentIsSuccessful { get; set; }

    [Column("Payment_Method_id")]
    public int? PaymentMethodId { get; set; }

    [InverseProperty("Payment")]
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    [ForeignKey("PaymentMethodId")]
    [InverseProperty("Payments")]
    public virtual PaymentMethod? PaymentMethod { get; set; }
}
