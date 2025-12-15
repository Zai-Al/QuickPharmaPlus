using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Interface;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace QuickPharmaPlus.Server.Controllers.External_System
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous] // later: [Authorize(Roles="Customer")]
    public class WishlistController : ControllerBase
    {
        private readonly IWishlistRepository _wishlistRepository;
        private readonly ISafetyCheckRepository _safetyCheckRepository;
        private readonly QuickPharmaPlusDbContext _context;

        public WishlistController(
            IWishlistRepository wishlistRepository,
            ISafetyCheckRepository safetyCheckRepository,
            QuickPharmaPlusDbContext context)
        {
            _wishlistRepository = wishlistRepository;
            _safetyCheckRepository = safetyCheckRepository;
            _context = context;
        }

        // =====================================================
        // DTOs (local, so you don't need extra files)
        // =====================================================
        public class CustomerIncompatibilitiesDto
        {
            public List<MedicationConflictDto> Medications { get; set; } = new();
            public List<string> Allergies { get; set; } = new();
            public List<string> Illnesses { get; set; } = new();
        }

        public class MedicationConflictDto
        {
            public int OtherProductId { get; set; }
            public string OtherProductName { get; set; } = string.Empty;
            public string Message { get; set; } = string.Empty;
        }

        // =====================================================
        // GET /api/wishlist?userId=5
        // ✅ returns incompatibilities in SAME SHAPE frontend expects
        // =====================================================
        [HttpGet]
        public async Task<IActionResult> GetMyWishlist([FromQuery] int userId)
        {
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var items = await _wishlistRepository.GetMyAsync(userId);
                if (items == null || items.Count == 0)
                    return Ok(new { count = 0, items = Array.Empty<object>() });

                // product ids
                var productIds = items
                    .Select(x => x.ProductId) // strongly typed
                    .Where(pid => pid > 0)
                    .Distinct()
                    .ToList();

                var illnessMap = await GetIllnessIncompatibilityMapAsync(userId, productIds);
                var allergyMap = await GetAllergyIncompatibilityMapAsync(userId, productIds);

                // shape response for React mapping
                var shaped = items.Select(x =>
                {
                    illnessMap.TryGetValue(x.ProductId, out var ill);
                    allergyMap.TryGetValue(x.ProductId, out var all);

                    ill ??= new List<string>();
                    all ??= new List<string>();

                    return new
                    {
                        productId = x.ProductId,
                        name = x.Name,
                        price = x.Price,
                        categoryName = x.CategoryName,
                        productTypeName = x.ProductTypeName,
                        requiresPrescription = x.RequiresPrescription,
                        inventoryCount = x.InventoryCount,
                        stockStatus = x.StockStatus,

                        incompatibilities = new
                        {
                            medications = Array.Empty<object>(), // med-vs-wishlist handled by POST confirm flow
                            allergies = all,
                            illnesses = ill
                        }
                    };
                }).ToList();

                return Ok(new { count = shaped.Count, items = shaped });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Wishlist Get failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // GET /api/wishlist/ids?userId=5
        [HttpGet("ids")]
        public async Task<IActionResult> GetMyWishlistIds([FromQuery] int userId)
        {
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var ids = await _wishlistRepository.GetMyIdsAsync(userId);
                return Ok(new { ids });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Wishlist ids failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // GET /api/wishlist/check-medication?userId=5&productId=10
        [HttpGet("check-medication")]
        public async Task<IActionResult> CheckMedicationIncompatibility([FromQuery] int userId, [FromQuery] int productId)
        {
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });
            if (productId <= 0) return BadRequest(new { error = "Invalid productId" });

            var inc = await BuildMedicationIncompatibilityAgainstWishlistAsync(userId, productId);

            return Ok(new
            {
                hasMedicationConflict = inc.Medications.Any(),
                incompatibilities = inc
            });
        }

        // POST /api/wishlist/{productId}?userId=5&forceAdd=true
        [HttpPost("{productId:int}")]
        public async Task<IActionResult> AddToWishlist(
            int productId,
            [FromQuery] int userId,
            [FromQuery] bool forceAdd = false)
        {
            if (productId <= 0) return BadRequest(new { error = "Invalid productId" });
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var inc = await BuildMedicationIncompatibilityAgainstWishlistAsync(userId, productId);

                if (!forceAdd && inc.Medications.Any())
                {
                    return Conflict(new
                    {
                        requiresConfirmation = true,
                        reason = "MEDICATION_INTERACTION",
                        incompatibilities = inc
                    });
                }

                var added = await _wishlistRepository.AddAsync(userId, productId);

                return Ok(new
                {
                    added,
                    incompatibilities = inc
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Wishlist add failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // DELETE /api/wishlist/{productId}?userId=5
        [HttpDelete("{productId:int}")]
        public async Task<IActionResult> RemoveFromWishlist(int productId, [FromQuery] int userId)
        {
            if (productId <= 0) return BadRequest(new { error = "Invalid productId" });
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var removed = await _wishlistRepository.RemoveAsync(userId, productId);
                return Ok(new { removed });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Wishlist remove failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // =====================================================
        // Helpers (medication-vs-wishlist)
        // =====================================================
        private async Task<CustomerIncompatibilitiesDto> BuildMedicationIncompatibilityAgainstWishlistAsync(int userId, int newProductId)
        {
            var inc = new CustomerIncompatibilitiesDto();

            var existingWishlistProductIds = await _context.WishLists
                .Where(w => w.UserId == userId)
                .Select(w => w.ProductId) // int?
                .Distinct()
                .ToListAsync();

            var otherIds = existingWishlistProductIds
                .Where(x => x.HasValue && x.Value > 0 && x.Value != newProductId)
                .Select(x => x.Value)
                .Distinct()
                .ToList();

            if (otherIds.Count == 0) return inc;

            var nameMap = await _context.Products
                .Where(p => otherIds.Contains(p.ProductId))
                .Select(p => new { p.ProductId, p.ProductName })
                .ToDictionaryAsync(x => x.ProductId, x => x.ProductName ?? "Unknown");

            foreach (var otherId in otherIds)
            {
                var res = await _safetyCheckRepository.CheckProductInteractionsAsync(newProductId, otherId);

                if (res != null && res.HasInteraction)
                {
                    var otherName = nameMap.TryGetValue(otherId, out var nm) ? nm : "Unknown";

                    inc.Medications.Add(new MedicationConflictDto
                    {
                        OtherProductId = otherId,
                        OtherProductName = otherName,
                        Message = res.Message ?? ""
                    });
                }
            }

            return inc;
        }

        // =====================================================
        // Helpers (health profile illness + allergy)
        // =====================================================
        private async Task<Dictionary<int, List<string>>> GetIllnessIncompatibilityMapAsync(int userId, List<int> productIds)
        {
            var result = new Dictionary<int, List<string>>();
            if (productIds == null || productIds.Count == 0) return result;

            var hpId = await _context.HealthProfiles
                .Where(h => h.UserId == userId)
                .Select(h => (int?)h.HealthProfileId)
                .FirstOrDefaultAsync();

            if (hpId == null) return result;

            var illnessIds = await _context.HealthProfileIllnesses
                .Where(hpi => hpi.HealthProfileId == hpId.Value)
                .Select(hpi => hpi.IllnessId)
                .Distinct()
                .ToListAsync();

            if (illnessIds.Count == 0) return result;

            var rows = await (
                from ip in _context.IngredientProducts
                join iii in _context.IllnessIngredientInteractions on ip.IngredientId equals iii.IngredientId
                join ill in _context.Illnesses on iii.IllnessId equals ill.IllnessId
                join iname in _context.IllnessNames on ill.IllnessNameId equals iname.IllnessNameId
                where ip.ProductId.HasValue
                      && productIds.Contains(ip.ProductId.Value)
                      && illnessIds.Contains(iii.IllnessId)
                select new
                {
                    ProductId = ip.ProductId.Value,
                    IllnessName = iname.IllnessName1
                }
            )
            .AsNoTracking()
            .ToListAsync();

            foreach (var g in rows.GroupBy(x => x.ProductId))
            {
                result[g.Key] = g
                    .Select(x => x.IllnessName)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct()
                    .OrderBy(x => x)
                    .ToList();
            }

            return result;
        }

        private async Task<Dictionary<int, List<string>>> GetAllergyIncompatibilityMapAsync(int userId, List<int> productIds)
        {
            var result = new Dictionary<int, List<string>>();
            if (productIds == null || productIds.Count == 0) return result;

            var hpId = await _context.HealthProfiles
                .Where(h => h.UserId == userId)
                .Select(h => (int?)h.HealthProfileId)
                .FirstOrDefaultAsync();

            if (hpId == null) return result;

            var allergyIds = await _context.HealthProfileAllergies
                .Where(hpa => hpa.HealthProfileId == hpId.Value)
                .Select(hpa => hpa.AllergyId)
                .Distinct()
                .ToListAsync();

            if (allergyIds.Count == 0) return result;

            var rows = await (
                from ip in _context.IngredientProducts
                join aii in _context.AllergyIngredientInteractions on ip.IngredientId equals aii.IngredientId
                join a in _context.Allergies on aii.AllergyId equals a.AllergyId
                join an in _context.AllergyNames on a.AlleryNameId equals an.AlleryNameId
                where ip.ProductId.HasValue
                      && productIds.Contains(ip.ProductId.Value)
                      && allergyIds.Contains(aii.AllergyId)
                select new
                {
                    ProductId = ip.ProductId.Value,
                    AllergyName = an.AllergyName1
                }
            )
            .AsNoTracking()
            .ToListAsync();

            foreach (var g in rows.GroupBy(x => x.ProductId))
            {
                result[g.Key] = g
                    .Select(x => x.AllergyName)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct()
                    .OrderBy(x => x)
                    .ToList();
            }

            return result;
        }
    }
}
