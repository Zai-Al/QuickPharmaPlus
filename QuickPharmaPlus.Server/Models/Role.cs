using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("Role")]
public partial class Role
{
    [Key]
    [Column("Role_id")]
    public int RoleId { get; set; }

    [Column("Role_name")]
    [StringLength(100)]
    public string? RoleName { get; set; }

    [InverseProperty("Role")]
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
