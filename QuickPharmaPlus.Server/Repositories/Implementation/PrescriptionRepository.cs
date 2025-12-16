using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Prescription;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class PrescriptionRepository : IPrescriptionRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        private static readonly Regex NamePattern = new(@"^[A-Za-z0-9\s.\-+_]*$");
        private static readonly Regex IdPattern = new(@"^[0-9]*$");

        public PrescriptionRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // ✅ HEALTH PRESCRIPTIONS ONLY (NO PAGINATION)
        // Used by PrescriptionTab
        // ============================================================
        public async Task<List<PrescriptionListDto>> GetUserHealthPrescriptionsAsync(int userId)
        {
            if (userId <= 0) return new List<PrescriptionListDto>();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            // Expire approved HEALTH prescriptions whose latest approval expiry date < today
            var approvedToExpire = _context.Prescriptions
                .Where(p => p.UserId == userId)
                .Where(p => (p.IsHealthPerscription ?? false) == true)
                .Where(p => p.PrescriptionStatusId == PrescriptionStatusConstants.Approved)
                .Where(p => p.Approvals.Any(a => a.ApprovalPrescriptionExpiryDate != null))
                .Where(p => p.Approvals.Max(a => a.ApprovalPrescriptionExpiryDate) < today);

            await approvedToExpire.ExecuteUpdateAsync(setters =>
                setters.SetProperty(p => p.PrescriptionStatusId, PrescriptionStatusConstants.Expired)
            );

            // Return ALL health prescriptions for this user
            return await _context.Prescriptions
                .Include(p => p.PrescriptionStatus)
                .Where(p => p.UserId == userId && (p.IsHealthPerscription ?? false) == true)
                .OrderByDescending(p => p.PrescriptionCreationDate)
                .Select(p => new PrescriptionListDto
                {
                    PrescriptionId = p.PrescriptionId,
                    PrescriptionName = p.PrescriptionName,

                    PrescriptionStatusId = p.PrescriptionStatusId,
                    PrescriptionStatusName = p.PrescriptionStatus != null ? p.PrescriptionStatus.PrescriptionStatusName : null,

                    PrescriptionCreationDate = p.PrescriptionCreationDate,
                    IsHealthPerscription = p.IsHealthPerscription,

                    HasPrescriptionDocument = p.PrescriptionDocument != null && p.PrescriptionDocument.Length > 0,
                    HasCprDocument = p.PrescriptionCprDocument != null && p.PrescriptionCprDocument.Length > 0,

                    LatestApprovalExpiryDate = p.Approvals
                        .Where(a => a.ApprovalPrescriptionExpiryDate != null)
                        .Max(a => a.ApprovalPrescriptionExpiryDate)
                })
                .AsNoTracking()
                .ToListAsync();
        }

        // ============================================================
        // (Optional keep) Paged method – not used in PrescriptionTab
        // ============================================================
        public async Task<PagedResult<PrescriptionListDto>> GetUserPrescriptionsAsync(
            int userId,
            int pageNumber,
            int pageSize,
            string? search = null,
            int[]? statusIds = null,
            bool? isHealth = null)
        {
            if (userId <= 0)
                return new PagedResult<PrescriptionListDto> { Items = new List<PrescriptionListDto>(), TotalCount = 0 };

            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();
                bool validName = NamePattern.IsMatch(search);
                bool validId = IdPattern.IsMatch(search);

                if (!validName && !validId)
                    return new PagedResult<PrescriptionListDto> { Items = new List<PrescriptionListDto>(), TotalCount = 0 };
            }

            statusIds = statusIds?.Where(x => x > 0).Distinct().ToArray();

            // expire-on-fetch (respect isHealth if provided)
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var approvedQuery = _context.Prescriptions
                .Where(p => p.UserId == userId && p.PrescriptionStatusId == PrescriptionStatusConstants.Approved)
                .Where(p => p.Approvals.Any(a => a.ApprovalPrescriptionExpiryDate != null))
                .Where(p => p.Approvals.Max(a => a.ApprovalPrescriptionExpiryDate) < today);

            if (isHealth.HasValue)
                approvedQuery = approvedQuery.Where(p => (p.IsHealthPerscription ?? false) == isHealth.Value);

            await approvedQuery.ExecuteUpdateAsync(setters =>
                setters.SetProperty(p => p.PrescriptionStatusId, PrescriptionStatusConstants.Expired)
            );

            var query = _context.Prescriptions
                .Include(p => p.PrescriptionStatus)
                .Where(p => p.UserId == userId)
                .AsQueryable();

            if (statusIds != null && statusIds.Length > 0)
                query = query.Where(p => p.PrescriptionStatusId.HasValue && statusIds.Contains(p.PrescriptionStatusId.Value));

            if (isHealth.HasValue)
                query = query.Where(p => (p.IsHealthPerscription ?? false) == isHealth.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                if (int.TryParse(term, out int idVal))
                    query = query.Where(p => p.PrescriptionId == idVal);
                else
                {
                    var lower = term.ToLower();
                    query = query.Where(p => (p.PrescriptionName ?? "").ToLower().StartsWith(lower));
                }
            }

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(p => p.PrescriptionCreationDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new PrescriptionListDto
                {
                    PrescriptionId = p.PrescriptionId,
                    PrescriptionName = p.PrescriptionName,

                    PrescriptionStatusId = p.PrescriptionStatusId,
                    PrescriptionStatusName = p.PrescriptionStatus != null ? p.PrescriptionStatus.PrescriptionStatusName : null,

                    PrescriptionCreationDate = p.PrescriptionCreationDate,
                    IsHealthPerscription = p.IsHealthPerscription,

                    HasPrescriptionDocument = p.PrescriptionDocument != null && p.PrescriptionDocument.Length > 0,
                    HasCprDocument = p.PrescriptionCprDocument != null && p.PrescriptionCprDocument.Length > 0,

                    LatestApprovalExpiryDate = p.Approvals
                        .Where(a => a.ApprovalPrescriptionExpiryDate != null)
                        .Max(a => a.ApprovalPrescriptionExpiryDate)
                })
                .AsNoTracking()
                .ToListAsync();

            return new PagedResult<PrescriptionListDto>
            {
                Items = items,
                TotalCount = total
            };
        }

        // ============================================================
        // CREATE (FORCE HEALTH)
        // ============================================================
        public async Task<int> CreateAsync(int userId, PrescriptionCreateDto dto)
        {
            if (userId <= 0) return 0;
            if (dto == null) return 0;

            if (string.IsNullOrWhiteSpace(dto.PrescriptionName)) return 0;
            if (dto.PrescriptionDocument == null) return 0;
            if (dto.PrescriptionCprDocument == null) return 0;

            var entity = new Prescription
            {
                UserId = userId,
                PrescriptionName = dto.PrescriptionName.Trim(),
                PrescriptionStatusId = PrescriptionStatusConstants.PendingApproval,
                PrescriptionCreationDate = DateOnly.FromDateTime(DateTime.UtcNow),

                // 🔒 Always health when created from this flow
                IsHealthPerscription = true,

                PrescriptionDocument = await ToBytesAsync(dto.PrescriptionDocument),
                PrescriptionCprDocument = await ToBytesAsync(dto.PrescriptionCprDocument),
            };

            _context.Prescriptions.Add(entity);
            await _context.SaveChangesAsync();
            return entity.PrescriptionId;
        }

        // ============================================================
        // UPDATE (FORCE HEALTH, NO SWITCHING)
        // ============================================================
        public async Task<bool> UpdateAsync(int userId, int prescriptionId, PrescriptionUpdateDto dto)
        {
            if (userId <= 0 || prescriptionId <= 0) return false;

            var entity = await _context.Prescriptions
                .FirstOrDefaultAsync(p => p.PrescriptionId == prescriptionId && p.UserId == userId);

            if (entity == null) return false;

            if (dto.PrescriptionName != null)
                entity.PrescriptionName = dto.PrescriptionName.Trim();

            // 🔒 Ensure it stays health; prevents switching type
            entity.IsHealthPerscription = true;

            if (dto.PrescriptionDocument != null)
                entity.PrescriptionDocument = await ToBytesAsync(dto.PrescriptionDocument);

            if (dto.PrescriptionCprDocument != null)
                entity.PrescriptionCprDocument = await ToBytesAsync(dto.PrescriptionCprDocument);

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int userId, int prescriptionId)
        {
            if (userId <= 0 || prescriptionId <= 0) return false;

            var entity = await _context.Prescriptions
                .FirstOrDefaultAsync(p => p.PrescriptionId == prescriptionId && p.UserId == userId);

            if (entity == null) return false;

            _context.Prescriptions.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(byte[] bytes, string contentType)?> GetPrescriptionDocumentAsync(int userId, int prescriptionId)
        {
            var entity = await _context.Prescriptions
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.PrescriptionId == prescriptionId && p.UserId == userId);

            if (entity?.PrescriptionDocument == null || entity.PrescriptionDocument.Length == 0) return null;

            return (entity.PrescriptionDocument, "application/pdf");
        }

        public async Task<(byte[] bytes, string contentType)?> GetCprDocumentAsync(int userId, int prescriptionId)
        {
            var entity = await _context.Prescriptions
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.PrescriptionId == prescriptionId && p.UserId == userId);

            if (entity?.PrescriptionCprDocument == null || entity.PrescriptionCprDocument.Length == 0) return null;

            return (entity.PrescriptionCprDocument, "application/pdf");
        }

        private static async Task<byte[]> ToBytesAsync(Microsoft.AspNetCore.Http.IFormFile file)
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            return ms.ToArray();
        }
    }
}
