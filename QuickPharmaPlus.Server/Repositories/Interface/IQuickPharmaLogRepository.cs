using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.QuickPharmaLog;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface IQuickPharmaLogRepository
    {
        // Fetch logs with pagination, search, and filters
        Task<PagedResult<QuickPharmaLogListDto>> GetAllQuickPharmaLogsAsync(
            int pageNumber,
            int pageSize,
            string? search = null,
            int? logTypeId = null,
            string? employeeName = null,
            DateOnly? actionDate = null);

        // Fetch all log types for dropdown
        Task<List<QuickPharmaLogTypeDto>> GetAllLogTypesAsync();

        // Auto-generated log creation methods
        Task CreateInventoryChangeLogAsync(int? userId, string? productName, int? branchId);
        Task CreateLoginFailureLogAsync(string email);
        Task CreateLoginSuccessLogAsync(int userId, string email);

        // NEW: logout log (same LogTypeId = 2)
        Task CreateLogoutLogAsync(int userId, string email);

        // ENHANCED: Added optional details parameter for rich descriptions
        Task CreateAddRecordLogAsync(int userId, string tableName, int recordId, string? details = null);
        Task CreateEditRecordLogAsync(int userId, string tableName, int recordId, string? details = null);
        Task CreateDeleteRecordLogAsync(int userId, string tableName, int recordId, string? details = null);
        
        Task CreatePrescriptionApprovalLogAsync(int userId, int prescriptionId);
        Task CreateControlledProductDispensedLogAsync(int userId, string productName, int prescriptionId);
        Task CreatePrescriptionRejectionLogAsync(int userId, int prescriptionId, string? details = null);
    }
}
