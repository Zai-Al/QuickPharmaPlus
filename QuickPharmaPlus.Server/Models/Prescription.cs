using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Prescription")]
[Index("PrescriptionStatusId", Name = "IXFK_Prescription_Prescription_Status")]
[Index("UserId", Name = "IXFK_Prescription_User")]
[Index("UserId", Name = "IXFK_Prescription_User_02")]
public partial class Prescription
{
    [Key]
    [Column("Prescription_id")]
    public int PrescriptionId { get; set; }

    [Column("Prescription_document")]
    public byte[]? PrescriptionDocument { get; set; }

    [Column("Prescription_cpr_document")]
    public byte[]? PrescriptionCprDocument { get; set; }

    [Column("Prescription_Status_id")]
    public int? PrescriptionStatusId { get; set; }

    [Column("Prescription_expiry_date")]
    public DateOnly? PrescriptionExpiryDate { get; set; }

    [Column("User_id")]
    public int? UserId { get; set; }

    [Column("Prescription_name")]
    [StringLength(200)]
    public string? PrescriptionName { get; set; }

    [InverseProperty("Prescription")]
    public virtual ICollection<Approval> Approvals { get; set; } = new List<Approval>();

    [ForeignKey("PrescriptionStatusId")]
    [InverseProperty("Prescriptions")]
    public virtual PrescriptionStatus? PrescriptionStatus { get; set; }

    [InverseProperty("Prescription")]
    public virtual ICollection<ProductOrder> ProductOrders { get; set; } = new List<ProductOrder>();

    [ForeignKey("UserId")]
    [InverseProperty("Prescriptions")]
    public virtual User? User { get; set; }
}
