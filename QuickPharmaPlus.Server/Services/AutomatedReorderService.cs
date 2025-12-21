using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Services
{
    public class AutomatedReorderService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AutomatedReorderService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(30); // Check every 30 seconds for testing

        public AutomatedReorderService(
            IServiceProvider serviceProvider,
            ILogger<AutomatedReorderService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 Automated Reorder Service started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckAndCreateReordersAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error occurred while checking for automated reorders.");
                }

                // Wait for the next check interval
                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("⏹️ Automated Reorder Service stopped.");
        }

        private async Task CheckAndCreateReordersAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<QuickPharmaPlusDbContext>();
            var logRepo = scope.ServiceProvider.GetRequiredService<IQuickPharmaLogRepository>();

            _logger.LogInformation("🔍 Starting automated reorder check at {Time}", DateTime.Now);

            // Get all active reorder rules
            var reorderRules = await context.Reorders
                .Include(r => r.Product)
                .Include(r => r.Supplier)
                .Include(r => r.Branch)
                    .ThenInclude(b => b.Address)
                        .ThenInclude(a => a.City)
                .Include(r => r.User)
                .Where(r => r.ProductId != null && r.BranchId > 0)
                .ToListAsync();

            _logger.LogInformation("📋 Found {Count} reorder rules to check.", reorderRules.Count);

            foreach (var rule in reorderRules)
            {
                try
                {
                    await ProcessReorderRuleAsync(rule, context, logRepo, scope.ServiceProvider);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error processing reorder rule ID {ReorderId}", rule.ReorderId);
                }
            }

            _logger.LogInformation("✅ Completed automated reorder check at {Time}", DateTime.Now);
        }

        private async Task ProcessReorderRuleAsync(
            Reorder rule,
            QuickPharmaPlusDbContext context,
            IQuickPharmaLogRepository logRepo,
            IServiceProvider serviceProvider)
        {
            if (!rule.ProductId.HasValue || rule.BranchId <= 0)
                return;

            // Calculate current inventory for this product in this branch (excluding expired items)
            var currentDate = DateOnly.FromDateTime(DateTime.Now);
            var expiryThresholdDate = currentDate.AddDays(29); // Items expiring within 29 days are excluded

            var currentInventory = await context.Inventories
                .Where(i => i.ProductId == rule.ProductId.Value &&
                            i.BranchId == rule.BranchId &&
                            i.InventoryExpiryDate > expiryThresholdDate && // Exclude soon-to-expire items
                            i.InventoryQuantity > 0)
                .SumAsync(i => i.InventoryQuantity ?? 0);

            _logger.LogInformation(
                "📊 Reorder Rule ID {ReorderId}: Product '{ProductName}' in Branch '{BranchName}' - Current Inventory: {CurrentInventory}, Threshold: {Threshold}",
                rule.ReorderId,
                rule.Product?.ProductName ?? "Unknown",
                rule.Branch?.Address?.City?.CityName ?? "Unknown",
                currentInventory,
                rule.ReorderThershold ?? 0
            );

            // Check if inventory is at or below threshold
            if (currentInventory <= (rule.ReorderThershold ?? 0))
            {
                // Check if there's already a pending order for this product and branch
                var existingPendingOrder = await context.SupplierOrders
                    .AnyAsync(so => so.ProductId == rule.ProductId.Value &&
                                   so.BranchId == rule.BranchId &&
                                   so.SupplierOrderStatusId == 1 && // Pending
                                   so.SupplierOrderTypeId == 2); // Automated

                if (existingPendingOrder)
                {
                    _logger.LogInformation(
                        "⏭️ Skipping reorder for Product ID {ProductId} in Branch ID {BranchId} - Pending automated order already exists.",
                        rule.ProductId.Value,
                        rule.BranchId
                    );
                    return;
                }

                _logger.LogInformation("🎯 Threshold reached! Creating automated order...");

                // Create automated order
                var supplierOrder = new SupplierOrder
                {
                    SupplierId = rule.SupplierId,
                    ProductId = rule.ProductId.Value,
                    SupplierOrderQuantity = rule.ReorderQuantity ?? 0,
                    EmployeeId = rule.UserId, // Use the user who created the reorder rule
                    BranchId = rule.BranchId,
                    SupplierOrderStatusId = 1, // Pending
                    SupplierOrderTypeId = 2, // Automated
                    SupplierOrderDate = DateTime.Now
                };

                context.SupplierOrders.Add(supplierOrder);
                await context.SaveChangesAsync();

                _logger.LogInformation(
                    "✅ Automated order created: Order ID {OrderId} for Product '{ProductName}' (Quantity: {Quantity}) in Branch '{BranchName}'",
                    supplierOrder.SupplierOrderId,
                    rule.Product?.ProductName ?? "Unknown",
                    supplierOrder.SupplierOrderQuantity,
                    rule.Branch?.Address?.City?.CityName ?? "Unknown"
                );

                // Create special log for automated order creation
                var details = $"AUTOMATED ORDER - Supplier: {rule.Supplier?.SupplierName ?? "Unknown"}, " +
                              $"Product: {rule.Product?.ProductName ?? "Unknown"}, " +
                              $"Quantity: {supplierOrder.SupplierOrderQuantity}, " +
                              $"Branch: {rule.Branch?.Address?.City?.CityName ?? "Unknown"}, " +
                              $"Triggered by: Inventory ({currentInventory}) reached threshold ({rule.ReorderThershold}), " +
                              $"Reorder Rule ID: {rule.ReorderId}, " +
                              $"Created by: {rule.User?.FirstName} {rule.User?.LastName}";

                await logRepo.CreateAddRecordLogAsync(
                    userId: rule.UserId ?? 0,
                    tableName: "SupplierOrder (Automated)",
                    recordId: supplierOrder.SupplierOrderId,
                    details: details
                );

                // =================== SEND EMAIL NOTIFICATION AFTER ORDER CREATION ===================
                _logger.LogInformation("📧 Preparing to send email notification for Order ID {OrderId}...", supplierOrder.SupplierOrderId);

                // Send email synchronously but handle exceptions gracefully
                try
                {
                    var emailService = serviceProvider.GetRequiredService<IAutomatedReorderEmailService>();

                    await emailService.TrySendAutomatedReorderEmailAsync(
                        supplierOrderId: supplierOrder.SupplierOrderId,
                        productId: rule.ProductId.Value,
                        branchId: rule.BranchId,
                        threshold: rule.ReorderThershold ?? 0
                    );

                    _logger.LogInformation("✅ Email notification process completed for Order ID {OrderId}", supplierOrder.SupplierOrderId);
                }
                catch (Exception ex)
                {
                    // Log error but don't fail the order creation
                    _logger.LogError(ex, "❌ Failed to send email notification for Order ID {OrderId}. Order was created successfully, but email failed.", supplierOrder.SupplierOrderId);
                }
            }
        }
    }
}