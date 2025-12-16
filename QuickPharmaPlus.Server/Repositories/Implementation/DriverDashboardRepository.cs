using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Dashboard;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class DriverDashboardRepository : IDriverDashboardRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public DriverDashboardRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        public async Task<DriverDashboardDto> GetDriverDashboardDataAsync(int driverUserId, int branchId)
        {
            var today = DateTime.Today;

            // 1. Get driver's assigned slot ID and slot name
            var driver = await _context.Users
                .Include(u => u.Slot)
                .Where(u => u.UserId == driverUserId)
                .Select(u => new
                {
                    SlotId = u.SlotId,
                    SlotName = u.Slot != null ? u.Slot.SlotName : null
                })
                .FirstOrDefaultAsync();

            // If driver has no slot assigned, return empty metrics
            if (driver == null || !driver.SlotId.HasValue)
            {
                return new DriverDashboardDto
                {
                    DriverSlotName = null,
                    Metrics = new DriverDashboardMetricsDto()
                };
            }

            var driverSlotId = driver.SlotId.Value;
            var driverSlotName = driver.SlotName;

            // 2. My Slot Pending Deliveries (slot + branch filtered)
            // Find OrderStatus for "Pending" or "Processing" (adjust based on your status names)
            var pendingStatusIds = await _context.OrderStatuses
                .Where(os => os.OrderStatusName == "Pending" || 
                             os.OrderStatusName == "Processing" ||
                             os.OrderStatusName == "Confirmed")
                .Select(os => os.OrderStatusId)
                .ToListAsync();

            var mySlotPendingDeliveries = await _context.Shippings
                .Include(s => s.Orders)
                .Where(s => s.ShippingSlotId == driverSlotId &&
                            s.BranchId == branchId &&
                            s.Orders.Any(o => o.OrderStatusId.HasValue && 
                                             pendingStatusIds.Contains(o.OrderStatusId.Value)))
                .CountAsync();

            // 3. My Slot Today's Deliveries (slot + branch filtered)
            var mySlotTodaysDeliveries = await _context.Shippings
                .Where(s => s.ShippingSlotId == driverSlotId &&
                            s.BranchId == branchId &&
                            s.ShippingDate.HasValue &&
                            s.ShippingDate.Value.Date == today)
                .CountAsync();

            // 4. My Slot Urgent Deliveries (slot + branch filtered)
            var mySlotUrgentDeliveries = await _context.Shippings
                .Where(s => s.ShippingSlotId == driverSlotId &&
                            s.BranchId == branchId &&
                            s.ShippingIsUrgent == true)
                .CountAsync();

            // 5. My Slot Total Deliveries (slot + branch filtered, all-time)
            var mySlotTotalDeliveries = await _context.Shippings
                .Where(s => s.ShippingSlotId == driverSlotId &&
                            s.BranchId == branchId)
                .CountAsync();

            // 6. Branch Pending Deliveries (all slots in this branch)
            var branchPendingDeliveries = await _context.Shippings
                .Include(s => s.Orders)
                .Where(s => s.BranchId == branchId &&
                            s.Orders.Any(o => o.OrderStatusId.HasValue && 
                                             pendingStatusIds.Contains(o.OrderStatusId.Value)))
                .CountAsync();

            // 7. Branch Total Deliveries (all slots in this branch)
            var branchTotalDeliveries = await _context.Shippings
                .Where(s => s.BranchId == branchId)
                .CountAsync();

            return new DriverDashboardDto
            {
                DriverSlotName = driverSlotName,
                Metrics = new DriverDashboardMetricsDto
                {
                    MySlotPendingDeliveries = mySlotPendingDeliveries,
                    MySlotTodaysDeliveries = mySlotTodaysDeliveries,
                    MySlotUrgentDeliveries = mySlotUrgentDeliveries,
                    MySlotTotalDeliveries = mySlotTotalDeliveries,
                    BranchPendingDeliveries = branchPendingDeliveries,
                    BranchTotalDeliveries = branchTotalDeliveries
                }
            };
        }
    }
}