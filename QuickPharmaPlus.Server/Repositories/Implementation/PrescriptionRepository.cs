using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Prescription;
using QuickPharmaPlus.Server.ModelsDTO.Prescription.Checkout;
using QuickPharmaPlus.Server.ModelsDTO.WishList_Cart;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class PrescriptionRepository : IPrescriptionRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public PrescriptionRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<PrescriptionListDto>> GetUserPrescriptionsAsync(
            int userId,
            int pageNumber,
            int pageSize,
            string? search = null,
            int[]? statusIds = null,
            bool? isHealth = null)
        {
            // Not used in PrescriptionTab (external)
            // Reserved for future internal/admin screens
            return await Task.FromResult(new PagedResult<PrescriptionListDto>
            {
                Items = new List<PrescriptionListDto>(),
                TotalCount = 0
            });
        }


        // List for PrescriptionTab
        public async Task<List<PrescriptionListDto>> GetUserHealthPrescriptionsAsync(int userId)
        {
            if (userId <= 0) return new List<PrescriptionListDto>();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            // expire-on-fetch (approved -> expired)
            var approvedToExpire = _context.Prescriptions
                .Where(p => p.UserId == userId)
                .Where(p => (p.IsHealthPerscription ?? false) == true)
                .Where(p => p.PrescriptionStatusId == PrescriptionStatusConstants.Approved)
                .Where(p => p.Approvals.Any(a => a.ApprovalPrescriptionExpiryDate != null))
                .Where(p => p.Approvals.Max(a => a.ApprovalPrescriptionExpiryDate) < today);

            await approvedToExpire.ExecuteUpdateAsync(setters =>
                setters.SetProperty(p => p.PrescriptionStatusId, PrescriptionStatusConstants.Expired)
            );

            // fetch list + include address and city
            var query =
                from p in _context.Prescriptions.Include(x => x.PrescriptionStatus)
                where p.UserId == userId && (p.IsHealthPerscription ?? false) == true
                join a in _context.Addresses on p.AddressId equals a.AddressId into aj
                from a in aj.DefaultIfEmpty()
                join c in _context.Cities on a.CityId equals c.CityId into cj
                from c in cj.DefaultIfEmpty()
                orderby p.PrescriptionCreationDate descending
                select new PrescriptionListDto
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
                        .Where(ap => ap.ApprovalPrescriptionExpiryDate != null)
                        .Max(ap => ap.ApprovalPrescriptionExpiryDate),

                    AddressId = p.AddressId,
                    CityId = a != null ? a.CityId : null,
                    CityName = c != null ? c.CityName : null,
                    Block = a != null ? a.Block : null,
                    Road = a != null ? a.Street : null,
                    BuildingFloor = a != null ? a.BuildingNumber : null,

                    PrescriptionDocumentContentType = p.PrescriptionDocumentContentType,
                    PrescriptionCprDocumentContentType = p.PrescriptionCprDocumentContentType,
                    PrescriptionFileName = p.PrescriptionDocumentFileName,
                    CprFileName = p.PrescriptionCprDocumentFileName

                };

            return await query.AsNoTracking().ToListAsync();
        }

        // Create: insert Address row, then Prescription row
        public async Task<int> CreateAsync(int userId, PrescriptionCreateDto dto)
        {
            if (userId <= 0 || dto == null) return 0;

            if (string.IsNullOrWhiteSpace(dto.PrescriptionName)) return 0;
            if (dto.PrescriptionDocument == null) return 0;
            if (dto.PrescriptionCprDocument == null) return 0;

            // address required
            if (!dto.CityId.HasValue || dto.CityId.Value <= 0) return 0;
            if (string.IsNullOrWhiteSpace(dto.Block)) return 0;
            if (string.IsNullOrWhiteSpace(dto.Road)) return 0;
            if (string.IsNullOrWhiteSpace(dto.BuildingFloor)) return 0;

            // ensure city exists
            var cityExists = await _context.Cities.AnyAsync(c => c.CityId == dto.CityId.Value);
            if (!cityExists) return 0;

            // 1) create prescription address row
            var address = new Address
            {
                CityId = dto.CityId.Value,
                Block = dto.Block.Trim(),
                Street = dto.Road.Trim(),
                BuildingNumber = dto.BuildingFloor.Trim(),
                IsProfileAdress = false
            };
            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            // 2) create prescription row
            var entity = new Prescription
            {
                UserId = userId,
                PrescriptionName = dto.PrescriptionName.Trim(),
                PrescriptionStatusId = PrescriptionStatusConstants.PendingApproval,
                PrescriptionCreationDate = DateOnly.FromDateTime(DateTime.UtcNow),

                IsHealthPerscription = true,
                AddressId = address.AddressId,

                PrescriptionDocument = await ToBytesAsync(dto.PrescriptionDocument),
                PrescriptionCprDocument = await ToBytesAsync(dto.PrescriptionCprDocument),

                PrescriptionDocumentContentType = NormalizeContentType(dto.PrescriptionDocument.ContentType),
                PrescriptionCprDocumentContentType = NormalizeContentType(dto.PrescriptionCprDocument.ContentType),
                PrescriptionDocumentFileName = dto.PrescriptionDocument.FileName,
                PrescriptionCprDocumentFileName = dto.PrescriptionCprDocument.FileName
            };

            _context.Prescriptions.Add(entity);
            await _context.SaveChangesAsync();
            return entity.PrescriptionId;
        }

        // Update: update Prescription + update linked Address row
        public async Task<bool> UpdateAsync(int userId, int prescriptionId, PrescriptionUpdateDto dto)
        {
            if (userId <= 0 || prescriptionId <= 0 || dto == null) return false;

            var entity = await _context.Prescriptions
                .FirstOrDefaultAsync(p => p.PrescriptionId == prescriptionId && p.UserId == userId);

            if (entity == null) return false;

            if (!entity.AddressId.HasValue || entity.AddressId.Value <= 0) return false;

            var address = await _context.Addresses.FirstOrDefaultAsync(a => a.AddressId == entity.AddressId.Value);
            if (address == null) return false;

            
            if (!string.IsNullOrWhiteSpace(dto.PrescriptionName))
                entity.PrescriptionName = dto.PrescriptionName.Trim();

            
            entity.IsHealthPerscription = true;

            // address updates (all required in your UX)
            if (dto.CityId.HasValue && dto.CityId.Value > 0)
            {
                var cityExists = await _context.Cities.AnyAsync(c => c.CityId == dto.CityId.Value);
                if (!cityExists) return false;

                address.CityId = dto.CityId.Value;
            }

            if (!string.IsNullOrWhiteSpace(dto.Block)) address.Block = dto.Block.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Road)) address.Street = dto.Road.Trim();
            if (!string.IsNullOrWhiteSpace(dto.BuildingFloor)) address.BuildingNumber = dto.BuildingFloor.Trim();

            // file replacements (optional)
            if (dto.PrescriptionDocument != null)
            {
                entity.PrescriptionDocument = await ToBytesAsync(dto.PrescriptionDocument);
                entity.PrescriptionDocumentContentType = NormalizeContentType(dto.PrescriptionDocument.ContentType);
                entity.PrescriptionDocumentFileName = dto.PrescriptionDocument.FileName;
            }


            if (dto.PrescriptionCprDocument != null)
            {
                entity.PrescriptionCprDocument = await ToBytesAsync(dto.PrescriptionCprDocument);
                entity.PrescriptionCprDocumentContentType = NormalizeContentType(dto.PrescriptionCprDocument.ContentType);
                entity.PrescriptionCprDocumentFileName = dto.PrescriptionCprDocument.FileName;
            }


            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int userId, int prescriptionId)
        {
            if (userId <= 0 || prescriptionId <= 0) return false;

            // load prescription (must belong to the user)
            var prescription = await _context.Prescriptions
                .FirstOrDefaultAsync(p => p.PrescriptionId == prescriptionId && p.UserId == userId);

            if (prescription == null) return false;

            // optional: delete the linked registered address row too
            // because you said this address is specifically created for the prescription
            if (prescription.AddressId.HasValue && prescription.AddressId.Value > 0)
            {
                var address = await _context.Addresses
                    .FirstOrDefaultAsync(a => a.AddressId == prescription.AddressId.Value);

                _context.Prescriptions.Remove(prescription);

                if (address != null && address.IsProfileAdress == false)
                    _context.Addresses.Remove(address);
            }
            else
            {
                _context.Prescriptions.Remove(prescription);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> CreateCheckoutAsync(int userId, PrescriptionCreateDto dto)
        {
            if (userId <= 0 || dto == null) return 0;

            var prescriptionName =
                string.IsNullOrWhiteSpace(dto.PrescriptionName)
                    ? $"Checkout Prescription - {DateTime.UtcNow:yyyyMMddHHmmss}"
                    : dto.PrescriptionName.Trim();

            if (dto.PrescriptionDocument == null) return 0;
            if (dto.PrescriptionCprDocument == null) return 0;

            // address REQUIRED for checkout upload (because your UI collects it)
            if (!dto.CityId.HasValue || dto.CityId.Value <= 0) return 0;
            if (string.IsNullOrWhiteSpace(dto.Block)) return 0;
            if (string.IsNullOrWhiteSpace(dto.Road)) return 0;
            if (string.IsNullOrWhiteSpace(dto.BuildingFloor)) return 0;

            var cityExists = await _context.Cities.AnyAsync(c => c.CityId == dto.CityId.Value);
            if (!cityExists) return 0;

            // 1) create address row (not profile)
            var address = new Address
            {
                CityId = dto.CityId.Value,
                Block = dto.Block.Trim(),
                Street = dto.Road.Trim(),
                BuildingNumber = dto.BuildingFloor.Trim(),
                IsProfileAdress = false
            };
            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            // 2) create checkout prescription linked to that address
            var entity = new Prescription
            {
                UserId = userId,
                PrescriptionName = prescriptionName,
                PrescriptionStatusId = PrescriptionStatusConstants.PendingApproval,
                PrescriptionCreationDate = DateOnly.FromDateTime(DateTime.UtcNow),

                IsHealthPerscription = false,
                AddressId = address.AddressId,

                PrescriptionDocument = await ToBytesAsync(dto.PrescriptionDocument),
                PrescriptionCprDocument = await ToBytesAsync(dto.PrescriptionCprDocument),

                PrescriptionDocumentContentType = NormalizeContentType(dto.PrescriptionDocument.ContentType),
                PrescriptionCprDocumentContentType = NormalizeContentType(dto.PrescriptionCprDocument.ContentType),
                PrescriptionDocumentFileName = dto.PrescriptionDocument.FileName,
                PrescriptionCprDocumentFileName = dto.PrescriptionCprDocument.FileName
            };

            _context.Prescriptions.Add(entity);
            await _context.SaveChangesAsync();
            return entity.PrescriptionId;
        }




        public async Task<(byte[] bytes, string contentType)?> GetPrescriptionDocumentAsync(int userId, int prescriptionId)
        {
            var p = await _context.Prescriptions.AsNoTracking()
                .FirstOrDefaultAsync(x => x.PrescriptionId == prescriptionId && x.UserId == userId);

            if (p?.PrescriptionDocument == null || p.PrescriptionDocument.Length == 0) return null;
            return (p.PrescriptionDocument, p.PrescriptionDocumentContentType ?? "application/octet-stream");
        }

        public async Task<(byte[] bytes, string contentType)?> GetCprDocumentAsync(int userId, int prescriptionId)
        {
            var p = await _context.Prescriptions.AsNoTracking()
                .FirstOrDefaultAsync(x => x.PrescriptionId == prescriptionId && x.UserId == userId);

            if (p?.PrescriptionCprDocument == null || p.PrescriptionCprDocument.Length == 0) return null;
            return (p.PrescriptionCprDocument, p.PrescriptionCprDocumentContentType ?? "application/octet-stream");
        }

        private static async Task<byte[]> ToBytesAsync(Microsoft.AspNetCore.Http.IFormFile file)
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            return ms.ToArray();
        }

        private static string NormalizeContentType(string? ct)
        {
            if (string.IsNullOrWhiteSpace(ct)) return "application/octet-stream";
            ct = ct.Trim().ToLowerInvariant();
            return ct switch
            {
                "application/pdf" => "application/pdf",
                "image/jpeg" => "image/jpeg",
                "image/jpg" => "image/jpeg",
                "image/png" => "image/png",
                _ => "application/octet-stream"
            };
        }

        // helper
        private static string Normalize(string? s)
        {
            if (string.IsNullOrWhiteSpace(s)) return "";
            return string.Join(" ",
                s.Trim().ToLowerInvariant()
                 .Split(' ', StringSplitOptions.RemoveEmptyEntries));
        }

        public async Task<CheckoutPrescriptionValidateResponseDto> ValidateCheckoutPrescriptionAsync(
            int userId,
            int prescriptionId,
            List<CartItemDto> cartItems,
            bool isHealthProfile
        )
        {
            var res = new CheckoutPrescriptionValidateResponseDto();

            if (userId <= 0 || prescriptionId <= 0)
            {
                res.IsValid = false;
                res.Reason = "INVALID_INPUT";
                return res;
            }

            cartItems ??= new();
            var prescribedItems = cartItems.Where(x => x.RequiresPrescription).ToList();

            if (!prescribedItems.Any())
            {
                res.IsValid = true;
                res.Reason = "NO_PRESCRIPTION_ITEMS";
                return res;
            }

            // 1️⃣ Load prescription
            var prescription = await _context.Prescriptions
                .Include(p => p.Approvals)
                .FirstOrDefaultAsync(p => p.PrescriptionId == prescriptionId);

            if (prescription == null)
            {
                res.IsValid = false;
                res.Reason = "PRESCRIPTION_NOT_FOUND";
                return res;
            }

            if ((prescription.UserId ?? 0) != userId)
            {
                res.IsValid = false;
                res.Reason = "NOT_OWNER";
                return res;
            }

            if ((prescription.PrescriptionStatusId ?? 0) != PrescriptionStatusConstants.Approved)
            {
                res.IsValid = false;
                res.Reason = "NOT_APPROVED";
                return res;
            }

            // 2️⃣ Build approval lookup (by product name)
            var approvalMap = prescription.Approvals
                .Where(a => !string.IsNullOrWhiteSpace(a.ApprovalProductName))
                .GroupBy(a => Normalize(a.ApprovalProductName))
                .ToDictionary(
                    g => g.Key,
                    g => g
                        .OrderByDescending(a => a.ApprovalTimestamp ?? DateTime.MinValue)
                        .First()
                );

            // 3️⃣ Validate cart items
            foreach (var item in prescribedItems)
            {
                var itemRes = new CheckoutPrescriptionValidateResponseDto.ItemResult
                {
                    ProductId = item.ProductId,
                    ProductName = item.Name,
                    CartQuantity = item.CartQuantity
                };

                var key = Normalize(item.Name);

                if (!approvalMap.TryGetValue(key, out var approval))
                {
                    itemRes.Matches = false;
                    itemRes.Reason = "PRODUCT_NOT_IN_PRESCRIPTION";
                    res.Items.Add(itemRes);
                    continue;
                }

                itemRes.ApprovedProductName = approval.ApprovalProductName;
                itemRes.ApprovedQuantity = approval.ApprovalQuantity;

                if (approval.ApprovalQuantity != item.CartQuantity)
                {
                    itemRes.Matches = false;
                    itemRes.Reason = "QUANTITY_MISMATCH";
                    res.Items.Add(itemRes);
                    continue;
                }

                itemRes.Matches = true;
                itemRes.Reason = "OK";
                res.Items.Add(itemRes);
            }

            res.IsValid = res.Items.All(i => i.Matches);
            res.Reason = res.IsValid ? "OK" : "MISMATCH";

            return res;
        }

        public async Task<PrescriptionListDto?> GetUserHealthPrescriptionByIdAsync(int userId, int prescriptionId)
        {
            if (userId <= 0 || prescriptionId <= 0) return null;

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            // expire-on-fetch for THIS prescription (approved -> expired)
            var approvedToExpire = _context.Prescriptions
                .Where(p => p.UserId == userId)
                .Where(p => p.PrescriptionId == prescriptionId)
                .Where(p => (p.IsHealthPerscription ?? false) == true)
                .Where(p => p.PrescriptionStatusId == PrescriptionStatusConstants.Approved)
                .Where(p => p.Approvals.Any(a => a.ApprovalPrescriptionExpiryDate != null))
                .Where(p => p.Approvals.Max(a => a.ApprovalPrescriptionExpiryDate) < today);

            await approvedToExpire.ExecuteUpdateAsync(setters =>
                setters.SetProperty(p => p.PrescriptionStatusId, PrescriptionStatusConstants.Expired)
            );

            // fetch single row + include address/city + status
            var query =
                from p in _context.Prescriptions.Include(x => x.PrescriptionStatus)
                where p.UserId == userId
                      && p.PrescriptionId == prescriptionId
                      && (p.IsHealthPerscription ?? false) == true
                join a in _context.Addresses on p.AddressId equals a.AddressId into aj
                from a in aj.DefaultIfEmpty()
                join c in _context.Cities on a.CityId equals c.CityId into cj
                from c in cj.DefaultIfEmpty()
                select new PrescriptionListDto
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
                        .Where(ap => ap.ApprovalPrescriptionExpiryDate != null)
                        .Max(ap => ap.ApprovalPrescriptionExpiryDate),

                    AddressId = p.AddressId,
                    CityId = a != null ? a.CityId : null,
                    CityName = c != null ? c.CityName : null,
                    Block = a != null ? a.Block : null,
                    Road = a != null ? a.Street : null,
                    BuildingFloor = a != null ? a.BuildingNumber : null,

                    PrescriptionDocumentContentType = p.PrescriptionDocumentContentType,
                    PrescriptionCprDocumentContentType = p.PrescriptionCprDocumentContentType,
                    PrescriptionFileName = p.PrescriptionDocumentFileName,
                    CprFileName = p.PrescriptionCprDocumentFileName
                };

            return await query.AsNoTracking().FirstOrDefaultAsync();
        }

    }
}
