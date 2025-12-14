using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Prescription_Plan")]
[Index("ApprovalId", Name = "IXFK_Prescription_Plan_Approval")]
[Index("PrescriptionPlanStatusId", Name = "IXFK_Prescription_Plan_Prescription_Plan_Status")]
[Index("ShippingId", Name = "IXFK_Prescription_Plan_Shipping")]
[Index("UserId", Name = "IXFK_Prescription_Plan_User")]
public partial class PrescriptionPlan
{
    [Key]
    [Column("Prescription_Plan_id")]
    public int PrescriptionPlanId { get; set; }

    [Column("Prescription_Plan_creation_date")]
    public DateOnly? PrescriptionPlanCreationDate { get; set; }

    [Column("Prescription_Plan_Status_id")]
    public int? PrescriptionPlanStatusId { get; set; }

    [Column("Prescription_Plan_total_amount", TypeName = "decimal(6, 3)")]
    public decimal? PrescriptionPlanTotalAmount { get; set; }

    [Column("User_id")]
    public int? UserId { get; set; }

    [Column("Shipping_id")]
    public int? ShippingId { get; set; }

    [Column("Approval_id")]
    public int? ApprovalId { get; set; }

    [ForeignKey("ApprovalId")]
    [InverseProperty("PrescriptionPlans")]
    public virtual Approval? Approval { get; set; }

    [ForeignKey("PrescriptionPlanStatusId")]
    [InverseProperty("PrescriptionPlans")]
    public virtual PrescriptionPlanStatus? PrescriptionPlanStatus { get; set; }

    [ForeignKey("ShippingId")]
    [InverseProperty("PrescriptionPlans")]
    public virtual Shipping? Shipping { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("PrescriptionPlans")]
    public virtual User? User { get; set; }
}
