using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Prescription_Status")]
public partial class PrescriptionStatus
{
    [Key]
    [Column("Prescription_Status_id")]
    public int PrescriptionStatusId { get; set; }

    [Column("Prescription_Status_name")]
    [StringLength(100)]
    public string? PrescriptionStatusName { get; set; }

    [InverseProperty("PrescriptionStatus")]
    public virtual ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}
