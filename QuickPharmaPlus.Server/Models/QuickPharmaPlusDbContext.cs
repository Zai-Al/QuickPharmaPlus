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

    public virtual DbSet<Address> Addresses { get; set; }

    public virtual DbSet<Allergy> Allergies { get; set; }

    public virtual DbSet<AllergyIngredientInteraction> AllergyIngredientInteractions { get; set; }

    public virtual DbSet<AllergyName> AllergyNames { get; set; }

    public virtual DbSet<AllergyType> AllergyTypes { get; set; }

    public virtual DbSet<Approval> Approvals { get; set; }

    public virtual DbSet<Branch> Branches { get; set; }

    public virtual DbSet<Cart> Carts { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<City> Cities { get; set; }

    public virtual DbSet<HealthProfile> HealthProfiles { get; set; }

    public virtual DbSet<HealthProfileAllergy> HealthProfileAllergies { get; set; }

    public virtual DbSet<HealthProfileIllness> HealthProfileIllnesses { get; set; }

    public virtual DbSet<Illness> Illnesses { get; set; }

    public virtual DbSet<IllnessIngredientInteraction> IllnessIngredientInteractions { get; set; }

    public virtual DbSet<IllnessName> IllnessNames { get; set; }

    public virtual DbSet<IllnessType> IllnessTypes { get; set; }

    public virtual DbSet<Ingredient> Ingredients { get; set; }

    public virtual DbSet<IngredientProduct> IngredientProducts { get; set; }

    public virtual DbSet<Interaction> Interactions { get; set; }

    public virtual DbSet<InteractionType> InteractionTypes { get; set; }

    public virtual DbSet<Inventory> Inventories { get; set; }

    public virtual DbSet<Log> Logs { get; set; }

    public virtual DbSet<LogType> LogTypes { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderStatus> OrderStatuses { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<PaymentMethod> PaymentMethods { get; set; }

    public virtual DbSet<Prescription> Prescriptions { get; set; }

    public virtual DbSet<PrescriptionPlan> PrescriptionPlans { get; set; }

    public virtual DbSet<PrescriptionPlanStatus> PrescriptionPlanStatuses { get; set; }

    public virtual DbSet<PrescriptionStatus> PrescriptionStatuses { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductOrder> ProductOrders { get; set; }

    public virtual DbSet<ProductType> ProductTypes { get; set; }

    public virtual DbSet<Reorder> Reorders { get; set; }

    public virtual DbSet<Report> Reports { get; set; }

    public virtual DbSet<ReportType> ReportTypes { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Severity> Severities { get; set; }

    public virtual DbSet<Shipping> Shippings { get; set; }

    public virtual DbSet<Slot> Slots { get; set; }

    public virtual DbSet<Supplier> Suppliers { get; set; }

    public virtual DbSet<SupplierOrder> SupplierOrders { get; set; }

    public virtual DbSet<SupplierOrderStatus> SupplierOrderStatuses { get; set; }

    public virtual DbSet<SupplierOrderType> SupplierOrderTypes { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<WishList> WishLists { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=tcp:quickpharmaplus-sql-01.database.windows.net,1433;Initial Catalog=QuickPharmaPlus;Persist Security Info=False;User ID=QuickPharmaPlusAdmin;Password=Admin123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasOne(d => d.City).WithMany(p => p.Addresses).HasConstraintName("FK_Address_City");
        });

        modelBuilder.Entity<Allergy>(entity =>
        {
            entity.HasKey(e => e.AllergyId).HasName("PK_Allergies");

            entity.HasOne(d => d.AlleryName).WithMany(p => p.Allergies).HasConstraintName("FK_Allergy_Allergy_Name");

            entity.HasOne(d => d.AlleryType).WithMany(p => p.Allergies).HasConstraintName("FK_Allergies_Allergy_Type");
        });

        modelBuilder.Entity<AllergyIngredientInteraction>(entity =>
        {
            entity.HasOne(d => d.Allergy).WithMany(p => p.AllergyIngredientInteractions)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AII_Allergy");

            entity.HasOne(d => d.Ingredient).WithMany(p => p.AllergyIngredientInteractions)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AII_Ingredient");
        });

        modelBuilder.Entity<AllergyName>(entity =>
        {
            entity.HasKey(e => e.AlleryNameId).HasName("PK_Allergy_name");
        });

        modelBuilder.Entity<AllergyType>(entity =>
        {
            entity.Property(e => e.AlleryTypeId).ValueGeneratedNever();
        });

        modelBuilder.Entity<Approval>(entity =>
        {
            entity.Property(e => e.ApprovalTimestamp).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Prescription).WithMany(p => p.Approvals).HasConstraintName("FK_Approval_Prescription");

            entity.HasOne(d => d.User).WithMany(p => p.Approvals).HasConstraintName("FK_Approval_User");
        });

        modelBuilder.Entity<Branch>(entity =>
        {
            entity.HasOne(d => d.Address).WithMany(p => p.Branches).HasConstraintName("FK_Branch_Address");

            entity.HasOne(d => d.User).WithMany(p => p.Branches).HasConstraintName("FK_Branch_Manager");
        });

        modelBuilder.Entity<Cart>(entity =>
        {
            entity.HasOne(d => d.Product).WithMany(p => p.Carts).HasConstraintName("FK_Cart_Product");

            entity.HasOne(d => d.User).WithMany(p => p.Carts).HasConstraintName("FK_Cart_User");
        });

        modelBuilder.Entity<City>(entity =>
        {
            entity.HasOne(d => d.Branch).WithMany(p => p.Cities).HasConstraintName("FK_City_Branch");
        });

        modelBuilder.Entity<HealthProfile>(entity =>
        {
            entity.HasOne(d => d.User).WithMany(p => p.HealthProfiles).HasConstraintName("FK_Health_Profile_User");
        });

        modelBuilder.Entity<HealthProfileAllergy>(entity =>
        {
            entity.HasOne(d => d.Allergy).WithMany(p => p.HealthProfileAllergies).HasConstraintName("FK_Health_Profile_Allergy_Allergy");

            entity.HasOne(d => d.HealthProfile).WithMany(p => p.HealthProfileAllergies).HasConstraintName("FK_Health_Profile_Allergy_Health_Profile");

            entity.HasOne(d => d.Severity).WithMany(p => p.HealthProfileAllergies).HasConstraintName("FK_HPA_Severity");
        });

        modelBuilder.Entity<HealthProfileIllness>(entity =>
        {
            entity.HasOne(d => d.HealthProfile).WithMany(p => p.HealthProfileIllnesses).HasConstraintName("FK_Health_Profile_Illness_Health_Profile");

            entity.HasOne(d => d.Illness).WithMany(p => p.HealthProfileIllnesses).HasConstraintName("FK_Health_Profile_Illness_Illness");

            entity.HasOne(d => d.Severity).WithMany(p => p.HealthProfileIllnesses).HasConstraintName("FK_HPI_Severity");
        });

        modelBuilder.Entity<Illness>(entity =>
        {
            entity.Property(e => e.IllnessId).ValueGeneratedNever();

            entity.HasOne(d => d.IllnessName).WithMany(p => p.Illnesses).HasConstraintName("FK_Illness_Illness_Name");

            entity.HasOne(d => d.LllnessType).WithMany(p => p.Illnesses).HasConstraintName("FK_Illness_Illness_Type");
        });

        modelBuilder.Entity<IllnessIngredientInteraction>(entity =>
        {
            entity.HasOne(d => d.Illness).WithMany(p => p.IllnessIngredientInteractions)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_III_Illness");

            entity.HasOne(d => d.Ingredient).WithMany(p => p.IllnessIngredientInteractions)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_III_Ingredient");
        });

        modelBuilder.Entity<Ingredient>(entity =>
        {
            entity.HasKey(e => e.IngredientId).HasName("PK_Ingredients");
        });

        modelBuilder.Entity<IngredientProduct>(entity =>
        {
            entity.HasOne(d => d.Ingredient).WithMany(p => p.IngredientProducts).HasConstraintName("FK_Ingredient_Product_Ingredient");

            entity.HasOne(d => d.Product).WithMany(p => p.IngredientProducts).HasConstraintName("FK_Ingredient_Product_Product");
        });

        modelBuilder.Entity<Interaction>(entity =>
        {
            entity.HasOne(d => d.IngredientA).WithMany(p => p.InteractionIngredientAs).HasConstraintName("FK_Interaction_IngredientA");

            entity.HasOne(d => d.IngredientB).WithMany(p => p.InteractionIngredientBs).HasConstraintName("FK_Interaction_IngredientB");

            entity.HasOne(d => d.InteractionType).WithMany(p => p.Interactions).HasConstraintName("FK_Interaction_Interaction_Type");
        });

        modelBuilder.Entity<Inventory>(entity =>
        {
            entity.HasOne(d => d.Branch).WithMany(p => p.Inventories).HasConstraintName("FK_Inventory_Branch");

            entity.HasOne(d => d.Product).WithMany(p => p.Inventories).HasConstraintName("FK_Inventory_Product");
        });

        modelBuilder.Entity<Log>(entity =>
        {
            entity.HasOne(d => d.LogType).WithMany(p => p.Logs).HasConstraintName("FK_Log_LogType");

            entity.HasOne(d => d.User).WithMany(p => p.Logs).HasConstraintName("FK_Log_User");
        });

        modelBuilder.Entity<LogType>(entity =>
        {
            entity.HasKey(e => e.LogTypeId).HasName("PK__Log_Type__92B17BDB63D98667");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasOne(d => d.OrderStatus).WithMany(p => p.Orders).HasConstraintName("FK_Order_Order_Status");

            entity.HasOne(d => d.Payment).WithMany(p => p.Orders).HasConstraintName("FK_Order_Payment");

            entity.HasOne(d => d.Shipping).WithMany(p => p.Orders).HasConstraintName("FK_Order_Shipping");

            entity.HasOne(d => d.User).WithMany(p => p.Orders).HasConstraintName("FK_Order_User");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasOne(d => d.PaymentMethod).WithMany(p => p.Payments).HasConstraintName("FK_Payment_Payment_Method");
        });

        modelBuilder.Entity<PaymentMethod>(entity =>
        {
            entity.Property(e => e.PaymentMethodId).ValueGeneratedNever();
        });

        modelBuilder.Entity<Prescription>(entity =>
        {
            entity.HasOne(d => d.Address).WithMany(p => p.Prescriptions)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Prescription_Address");

            entity.HasOne(d => d.PrescriptionStatus).WithMany(p => p.Prescriptions).HasConstraintName("FK_Prescription_Prescription_Status");

            entity.HasOne(d => d.User).WithMany(p => p.Prescriptions).HasConstraintName("FK_Prescription_Customer");
        });

        modelBuilder.Entity<PrescriptionPlan>(entity =>
        {
            entity.HasOne(d => d.Approval).WithMany(p => p.PrescriptionPlans).HasConstraintName("FK_Prescription_Plan_Approval");

            entity.HasOne(d => d.PrescriptionPlanStatus).WithMany(p => p.PrescriptionPlans).HasConstraintName("FK_Prescription_Plan_Prescription_Plan_Status");

            entity.HasOne(d => d.Shipping).WithMany(p => p.PrescriptionPlans).HasConstraintName("FK_Prescription_Plan_Shipping");

            entity.HasOne(d => d.User).WithMany(p => p.PrescriptionPlans).HasConstraintName("FK_Prescription_Plan_User");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Category).WithMany(p => p.Products).HasConstraintName("FK_Product_Category");

            entity.HasOne(d => d.ProductType).WithMany(p => p.Products).HasConstraintName("FK_Product_Product_Type");

            entity.HasOne(d => d.Supplier).WithMany(p => p.Products).HasConstraintName("FK_Product_Supplier");
        });

        modelBuilder.Entity<ProductOrder>(entity =>
        {
            entity.Property(e => e.Quantity).HasDefaultValue(1);

            entity.HasOne(d => d.Order).WithMany(p => p.ProductOrders).HasConstraintName("FK_Product_Order_Order");

            entity.HasOne(d => d.Prescription).WithMany(p => p.ProductOrders).HasConstraintName("FK_Product_Order_Prescription");

            entity.HasOne(d => d.Product).WithMany(p => p.ProductOrders).HasConstraintName("FK_Product_Order_Product");
        });

        modelBuilder.Entity<ProductType>(entity =>
        {
            entity.HasOne(d => d.Category).WithMany(p => p.ProductTypes).HasConstraintName("FK_Product_Type_Category");
        });

        modelBuilder.Entity<Reorder>(entity =>
        {
            entity.HasOne(d => d.Branch).WithMany(p => p.Reorders)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Reorder_Branch");

            entity.HasOne(d => d.Product).WithMany(p => p.Reorders).HasConstraintName("FK_Reorder_Product");

            entity.HasOne(d => d.Supplier).WithMany(p => p.Reorders).HasConstraintName("FK_Reorder_Supplier");

            entity.HasOne(d => d.User).WithMany(p => p.Reorders).HasConstraintName("FK_Reorder_User");
        });

        modelBuilder.Entity<Report>(entity =>
        {
            entity.Property(e => e.ReportCreationTimestamp).HasDefaultValueSql("(sysutcdatetime())");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PK_User_Role");
        });

        modelBuilder.Entity<Shipping>(entity =>
        {
            entity.HasOne(d => d.Address).WithMany(p => p.Shippings).HasConstraintName("FK_Shipping_Address");

            entity.HasOne(d => d.Branch).WithMany(p => p.Shippings).HasConstraintName("FK_Shipping_Branch");

            entity.HasOne(d => d.ShippingSlot).WithMany(p => p.Shippings).HasConstraintName("FK_Shipping_Slot");

            entity.HasOne(d => d.User).WithMany(p => p.Shippings).HasConstraintName("FK_Shipping_User");
        });

        modelBuilder.Entity<Slot>(entity =>
        {
            entity.HasKey(e => e.SlotId).HasName("PK__Slot__1AE5AEE6D44E0A8E");
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.HasOne(d => d.Address).WithMany(p => p.Suppliers).HasConstraintName("FK_Supplier_Address");
        });

        modelBuilder.Entity<SupplierOrder>(entity =>
        {
            entity.HasOne(d => d.Branch).WithMany(p => p.SupplierOrders)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Supplier_Order_Branch");

            entity.HasOne(d => d.Employee).WithMany(p => p.SupplierOrders).HasConstraintName("FK_Supplier_Order_User");

            entity.HasOne(d => d.Product).WithMany(p => p.SupplierOrders).HasConstraintName("FK_Supplier_Order_Product");

            entity.HasOne(d => d.Supplier).WithMany(p => p.SupplierOrders).HasConstraintName("FK_Supplier_Order_Supplier");

            entity.HasOne(d => d.SupplierOrderType).WithMany(p => p.SupplierOrders).HasConstraintName("FK_Supplier_Order_Type");
        });

        modelBuilder.Entity<SupplierOrderStatus>(entity =>
        {
            entity.Property(e => e.ProductOrderStatusId).ValueGeneratedOnAdd();
        });

        modelBuilder.Entity<SupplierOrderType>(entity =>
        {
            entity.HasKey(e => e.SupplierOrderTypeId).HasName("PK__Supplier__6B90B83F862CFC19");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasOne(d => d.Address).WithMany(p => p.Users).HasConstraintName("FK_User_Address");

            entity.HasOne(d => d.Branch).WithMany(p => p.Users).HasConstraintName("FK_User_Branch");

            entity.HasOne(d => d.Role).WithMany(p => p.Users).HasConstraintName("FK_User_Role");

            entity.HasOne(d => d.Slot).WithMany(p => p.Users).HasConstraintName("FK_User_Slot");
        });

        modelBuilder.Entity<WishList>(entity =>
        {
            entity.HasOne(d => d.Product).WithMany(p => p.WishLists).HasConstraintName("FK_Wish_List_Product");

            entity.HasOne(d => d.User).WithMany(p => p.WishLists).HasConstraintName("FK_Wish_List_User");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
