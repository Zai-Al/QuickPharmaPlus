using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

[Table("City")]
[Index("BranchId", Name = "IXFK_City_Branch")]
public partial class City
{
    [Key]
    [Column("City_id")]
    public int CityId { get; set; }

    [Column("City_name")]
    [StringLength(150)]
    public string? CityName { get; set; }

    [Column("Branch_id")]
    public int? BranchId { get; set; }

    [InverseProperty("City")]
    public virtual ICollection<Address> Addresses { get; set; } = new List<Address>();

    [ForeignKey("BranchId")]
    [InverseProperty("Cities")]
    public virtual Branch? Branch { get; set; }
}
