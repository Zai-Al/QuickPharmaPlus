using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Approval")]
[Index("PrescriptionId", Name = "IXFK_Approval_Prescription")]
[Index("UserId", Name = "IXFK_Approval_User")]
public partial class Approval
{
    [Key]
    [Column("Approval_id")]
    public int ApprovalId { get; set; }

    [Column("Approval_date")]
    public DateOnly? ApprovalDate { get; set; }

    [Column("Approval_product_name")]
    [StringLength(200)]
    public string? ApprovalProductName { get; set; }

    [Column("Approval_dosage")]
    [StringLength(200)]
    public string? ApprovalDosage { get; set; }

    [Column("Approval_prescription_expiry_date")]
    public DateOnly? ApprovalPrescriptionExpiryDate { get; set; }

    [Column("Approval_quantity")]
    public int? ApprovalQuantity { get; set; }

    [Column("Prescription_id")]
    public int? PrescriptionId { get; set; }

    [Column("User_id")]
    public int? UserId { get; set; }

    [Column("Approval_timestamp")]
    public DateTime? ApprovalTimestamp { get; set; }

    [ForeignKey("PrescriptionId")]
    [InverseProperty("Approvals")]
    public virtual Prescription? Prescription { get; set; }

    [InverseProperty("Approval")]
    public virtual ICollection<PrescriptionPlan> PrescriptionPlans { get; set; } = new List<PrescriptionPlan>();

    [ForeignKey("UserId")]
    [InverseProperty("Approvals")]
    public virtual User? User { get; set; }
}
