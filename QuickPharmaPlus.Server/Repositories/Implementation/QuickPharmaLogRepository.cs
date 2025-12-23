using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.QuickPharmaLog;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class QuickPharmaLogRepository : IQuickPharmaLogRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public QuickPharmaLogRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<QuickPharmaLogListDto>> GetAllQuickPharmaLogsAsync(
            int pageNumber,
            int pageSize,
            string? search = null,
            int? logTypeId = null,
            string? employeeName = null,
            DateOnly? actionDate = null)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            var query = _context.Logs
                .Include(l => l.LogType)
                .Include(l => l.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();

                var validPattern = @"^[0-9]*$";
                if (!Regex.IsMatch(search, validPattern))
                {
                    return new PagedResult<QuickPharmaLogListDto>
                    {
                        Items = new List<QuickPharmaLogListDto>(),
                        TotalCount = 0
                    };
                }

                if (int.TryParse(search, out int logId))
                {
                    query = query.Where(l => l.LogId == logId);
                }
            }

            if (logTypeId.HasValue)
            {
                query = query.Where(l => l.LogTypeId == logTypeId.Value);
            }

            if (!string.IsNullOrWhiteSpace(employeeName))
            {
                var nameLower = employeeName.Trim().ToLower();
                query = query.Where(l => l.User != null &&
                    (l.User.FirstName + " " + l.User.LastName).ToLower().Contains(nameLower));
            }

            if (actionDate.HasValue)
            {
                var dateFilter = actionDate.Value;
                query = query.Where(l =>
                    l.LogTimestamp.HasValue &&
                    DateOnly.FromDateTime(l.LogTimestamp.Value) == dateFilter);
            }

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(l => l.LogTimestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new QuickPharmaLogListDto
                {
                    LogId = l.LogId,
                    LogTypeName = l.LogType != null ? l.LogType.LogTypeName : "N/A",
                    LogDescription = l.LogDescription,
                    LogTimestamp = l.LogTimestamp,
                    EmployeeName = l.User != null
                        ? (l.User.FirstName + " " + l.User.LastName).Trim()
                        : "System"
                })
                .ToListAsync();

            return new PagedResult<QuickPharmaLogListDto>
            {
                Items = items,
                TotalCount = total
            };
        }

        public async Task<List<QuickPharmaLogTypeDto>> GetAllLogTypesAsync()
        {
            return await _context.LogTypes
                .OrderBy(lt => lt.LogTypeName)
                .Select(lt => new QuickPharmaLogTypeDto
                {
                    LogTypeId = lt.LogTypeId,
                    LogTypeName = lt.LogTypeName
                })
                .ToListAsync();
        }

        public async Task CreateInventoryChangeLogAsync(int? userId, string? productName, int? branchId)
        {
            var user = userId.HasValue ? await _context.Users.FindAsync(userId.Value) : null;
            var userName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "System";

            string? branchName = null;

            if (branchId.HasValue && branchId.Value > 0)
            {
                branchName = await _context.Branches
                    .Where(b => b.BranchId == branchId.Value)
                    .Select(b => b.Address != null && b.Address.City != null
                        ? b.Address.City.CityName
                        : null)
                    .FirstOrDefaultAsync();
            }

            var description =
                $"Inventory update for product '{productName ?? "Unknown"}' at branch '{branchName ?? "Unknown"}' by {userName}";

            var log = new Log
            {
                LogDescription = description,
                LogTimestamp = DateTime.Now,
                LogTypeId = 1,
                UserId = userId
            };

            _context.Logs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task CreateLoginFailureLogAsync(string email)
        {
            var description = $"User failed to login three times with email: {email}";

            var log = new Log
            {
                LogDescription = description,
                LogTimestamp = DateTime.Now,
                LogTypeId = 2,
                UserId = null
            };

            _context.Logs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task CreateAddRecordLogAsync(int userId, string tableName, int recordId, string? details = null)
        {
            var user = await _context.Users.FindAsync(userId);
            var userName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "Unknown User";

            var description = $"{userName} added a record to {tableName} (Record ID: {recordId})";

            if (!string.IsNullOrWhiteSpace(details))
            {
                description += $" - {details}";
            }

            var log = new Log
            {
                LogDescription = description,
                LogTimestamp = DateTime.Now,
                LogTypeId = 3,
                UserId = userId
            };

            _context.Logs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task CreateEditRecordLogAsync(int userId, string tableName, int recordId, string? details = null)
        {
            var user = await _context.Users.FindAsync(userId);
            var userName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "Unknown User";

            var description = $"{userName} edited a record in {tableName} (Record ID: {recordId})";

            if (!string.IsNullOrWhiteSpace(details))
            {
                description += $" - {details}";
            }

            var log = new Log
            {
                LogDescription = description,
                LogTimestamp = DateTime.Now,
                LogTypeId = 4,
                UserId = userId
            };

            _context.Logs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task CreateDeleteRecordLogAsync(int userId, string tableName, int recordId, string? details = null)
        {
            var user = await _context.Users.FindAsync(userId);
            var userName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "Unknown User";

            var description = $"{userName} deleted a record from {tableName} (Record ID: {recordId})";

            if (!string.IsNullOrWhiteSpace(details))
            {
                description += $" - {details}";
            }

            var log = new Log
            {
                LogDescription = description,
                LogTimestamp = DateTime.Now,
                LogTypeId = 5,
                UserId = userId
            };

            _context.Logs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task CreatePrescriptionApprovalLogAsync(int userId, int prescriptionId)
        {
            var user = await _context.Users.FindAsync(userId);
            var userName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "Unknown User";

            var description = $"{userName} approved prescription ID: {prescriptionId}";

            var log = new Log
            {
                LogDescription = description,
                LogTimestamp = DateTime.Now,
                LogTypeId = 6,
                UserId = userId
            };

            _context.Logs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task CreateControlledProductDispensedLogAsync(int userId, string productName, int prescriptionId)
        {
            var user = await _context.Users.FindAsync(userId);
            var userName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "Unknown User";

            var description = $"Controlled medication '{productName}' dispensed by {userName} for prescription ID: {prescriptionId}";

            var log = new Log
            {
                LogDescription = description,
                LogTimestamp = DateTime.Now,
                LogTypeId = 7,
                UserId = userId
            };

            _context.Logs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task CreatePrescriptionRejectionLogAsync(int userId, int prescriptionId, string? details = null)
        {
            var user = await _context.Users.FindAsync(userId);
            var userName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "Unknown User";

            var description = $"{userName} rejected prescription ID: {prescriptionId}";

            if (!string.IsNullOrWhiteSpace(details))
            {
                description += $" - {details}";
            }

            var log = new Log
            {
                LogDescription = description,
                LogTimestamp = DateTime.Now,
                LogTypeId = 10, // Prescription Rejection
                UserId = userId
            };

            _context.Logs.Add(log);
            await _context.SaveChangesAsync();
        }
    }
}