using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Dashboard;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class PharmacistDashboardRepository : IPharmacistDashboardRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public PharmacistDashboardRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        public async Task<PharmacistDashboardDto> GetPharmacistDashboardDataAsync(int pharmacistUserId, int branchId)
        {
            var today = DateOnly.FromDateTime(DateTime.Today);

            // 1. My Total Approvals (this specific pharmacist)
            var myTotalApprovals = await _context.Approvals
                .Where(a => a.UserId == pharmacistUserId)
                .CountAsync();

            // 2. My Approvals Today (this specific pharmacist)
            var myApprovalsToday = await _context.Approvals
            .Where(a => a.UserId == pharmacistUserId &&
                a.ApprovalDate.HasValue &&
                a.ApprovalDate.Value == today)
            .CountAsync();

            // 3. Branch Pending Prescriptions
            // Find PrescriptionStatusId for "Pending Approval" (adjust status name if different)
            var pendingStatusId = await _context.PrescriptionStatuses
                .Where(ps => ps.PrescriptionStatusName == "Pending Approval")
                .Select(ps => ps.PrescriptionStatusId)
                .FirstOrDefaultAsync();

            var branchPendingPrescriptions = 0;
            if (pendingStatusId > 0)
            {
                // Count prescriptions from customers in this branch that are pending
                branchPendingPrescriptions = await _context.Prescriptions
                    .Include(p => p.User)
                    .Where(p => p.User != null &&
                                p.User.BranchId == branchId &&
                                p.PrescriptionStatusId == pendingStatusId)
                    .CountAsync();
            }

            // 4. Branch Total Prescriptions (all prescriptions from this branch)
            var branchTotalPrescriptions = await _context.Prescriptions
                .Include(p => p.User)
                .Where(p => p.User != null && p.User.BranchId == branchId)
                .CountAsync();

            // 5. Branch Total Orders (customer orders from this branch)
            var branchTotalOrders = await _context.Orders
                .Include(o => o.Shipping)
                .Where(o => o.Shipping != null && o.Shipping.BranchId == branchId)
                .CountAsync();

            // 6. Branch Controlled Medications Dispensed
            // Count product orders where Product.IsControlled = true, from this branch
            var branchControlledMedicationsDispensed = await _context.ProductOrders
                .Include(po => po.Product)
                .Include(po => po.Order)
                    .ThenInclude(o => o.Shipping)
                .Where(po => po.Product != null &&
                             po.Product.IsControlled == true &&
                             po.Order != null &&
                             po.Order.Shipping != null &&
                             po.Order.Shipping.BranchId == branchId)
                .CountAsync();

            return new PharmacistDashboardDto
            {
                Metrics = new PharmacistDashboardMetricsDto
                {
                    MyTotalApprovals = myTotalApprovals,
                    MyApprovalsToday = myApprovalsToday,
                    BranchPendingPrescriptions = branchPendingPrescriptions,
                    BranchTotalPrescriptions = branchTotalPrescriptions,
                    BranchTotalOrders = branchTotalOrders,
                    BranchControlledMedicationsDispensed = branchControlledMedicationsDispensed
                }
            };
        }
    }
}