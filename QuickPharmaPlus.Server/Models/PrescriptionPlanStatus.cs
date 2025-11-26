using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Prescription_Plan_Status")]
public partial class PrescriptionPlanStatus
{
    [Key]
    [Column("Prescription_Plan_Status_id")]
    public int PrescriptionPlanStatusId { get; set; }

    [Column("Prescription_Plan_Status_name")]
    [StringLength(100)]
    public string? PrescriptionPlanStatusName { get; set; }

    [InverseProperty("PrescriptionPlanStatus")]
    public virtual ICollection<PrescriptionPlan> PrescriptionPlans { get; set; } = new List<PrescriptionPlan>();
}
