using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace QuickPharmaPlus.Server.Models;

public partial class QuickPharmaPlusDbContext : DbContext
{
    public QuickPharmaPlusDbContext()
    {
    }

    public QuickPharmaPlusDbContext(DbContextOptions<QuickPharmaPlusDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Interaction> Interactions { get; set; }

    public virtual DbSet<Log> Logs { get; set; }

    public virtual DbSet<LogType> LogTypes { get; set; }

    public virtual DbSet<SupplierOrder> SupplierOrders { get; set; }

    public virtual DbSet<SupplierOrderType> SupplierOrderTypes { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Data Source=(localdb)\\MSSQLLocalDB;Database=QuickPharmaPlus;Trusted_Connection=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Log>(entity =>
        {
            entity.HasOne(d => d.LogType).WithMany(p => p.Logs).HasConstraintName("FK_Log_LogType");
        });

        modelBuilder.Entity<LogType>(entity =>
        {
            entity.HasKey(e => e.LogTypeId).HasName("PK__Log_Type__92B17BDB28718920");
        });

        modelBuilder.Entity<SupplierOrder>(entity =>
        {
            entity.HasOne(d => d.SupplierOrderType).WithMany(p => p.SupplierOrders).HasConstraintName("FK_Supplier_Order_Type");
        });

        modelBuilder.Entity<SupplierOrderType>(entity =>
        {
            entity.HasKey(e => e.SupplierOrderTypeId).HasName("PK__Supplier__6B90B83F3DA7B769");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
