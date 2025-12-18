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
[Index("AddressId", Name = "IX_Prescription_address_id")]
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

    [Column("Prescription_creation_date")]
    public DateOnly? PrescriptionCreationDate { get; set; }

    [Column("User_id")]
    public int? UserId { get; set; }

    [Column("Prescription_name")]
    [StringLength(200)]
    public string? PrescriptionName { get; set; }

    [Column("isHealthPerscription")]
    public bool? IsHealthPerscription { get; set; }

    [StringLength(100)]
    public string? PrescriptionDocumentContentType { get; set; }

    [StringLength(100)]
    public string? PrescriptionCprDocumentContentType { get; set; }

    [StringLength(255)]
    public string? PrescriptionDocumentFileName { get; set; }

    [StringLength(255)]
    public string? PrescriptionCprDocumentFileName { get; set; }

    [Column("address_id")]
    public int? AddressId { get; set; }

    [ForeignKey("AddressId")]
    [InverseProperty("Prescriptions")]
    public virtual Address? Address { get; set; }

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
