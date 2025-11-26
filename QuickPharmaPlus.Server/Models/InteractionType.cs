using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Interaction_Type")]
public partial class InteractionType
{
    [Key]
    [Column("Interaction_Type_id")]
    public int InteractionTypeId { get; set; }

    [Column("Interaction_Type_name")]
    [StringLength(300)]
    public string? InteractionTypeName { get; set; }

    [Column("Interaction_id")]
    public int? InteractionId { get; set; }

    [InverseProperty("InteractionType")]
    public virtual ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();
}
