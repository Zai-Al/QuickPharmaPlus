using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.WishList_Cart;
using QuickPharmaPlus.Server.ModelsDTO.Incompatibility;
using QuickPharmaPlus.Server.Repositories.Interface;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace QuickPharmaPlus.Server.Controllers.External_System
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous] // later: [Authorize(Roles = "Customer")]
    public class CartController : ControllerBase
    {
        private readonly ICartRepository _cartRepository;
        private readonly ISafetyCheckRepository _safetyCheckRepository;
        private readonly QuickPharmaPlusDbContext _context;

        public CartController(
            ICartRepository cartRepository,
            ISafetyCheckRepository safetyCheckRepository,
            QuickPharmaPlusDbContext context)
        {
            _cartRepository = cartRepository;
            _safetyCheckRepository = safetyCheckRepository;
            _context = context;
        }

        // =====================================================
        // GET /api/cart?userId=5
        // ✅ Now returns incompatibilities (illness+allergy) in the SAME SHAPE your React expects
        // =====================================================
        [HttpGet]
        public async Task<IActionResult> GetMyCart([FromQuery] int userId)
        {
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var items = await _cartRepository.GetMyAsync(userId);
                if (items == null || items.Count == 0)
                    return Ok(new { count = 0, items = Array.Empty<object>() });

                var productIds = items
                    .Select(x => x.ProductId)
                    .Where(x => x > 0)
                    .Distinct()
                    .ToList();

                var illnessMap = await GetIllnessIncompatibilityMapAsync(userId, productIds);
                var allergyMap = await GetAllergyIncompatibilityMapAsync(userId, productIds);

                // ✅ Shape the response so frontend can read:
                // x.incompatibilities.medications / allergies / illnesses
                var shaped = items.Select(item =>
                {
                    illnessMap.TryGetValue(item.ProductId, out var ill);
                    allergyMap.TryGetValue(item.ProductId, out var all);

                    ill ??= new List<string>();
                    all ??= new List<string>();

                    return new
                    {
                        cartItemId = item.CartItemId,
                        productId = item.ProductId,
                        name = item.Name,
                        price = item.Price,
                        categoryName = item.CategoryName,
                        productTypeName = item.ProductTypeName,
                        requiresPrescription = item.RequiresPrescription,
                        cartQuantity = item.CartQuantity,
                        inventoryCount = item.InventoryCount,
                        stockStatus = item.StockStatus,

                        incompatibilities = new
                        {
                            medications = Array.Empty<object>(), // cart–cart meds handled by POST confirm flow
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
                    error = "Cart Get failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // =====================================================
        // GET /api/cart/check-medication?userId=5&productId=10
        // =====================================================
        [HttpGet("check-medication")]
        public async Task<IActionResult> CheckMedicationIncompatibility(
            [FromQuery] int userId,
            [FromQuery] int productId)
        {
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });
            if (productId <= 0) return BadRequest(new { error = "Invalid productId" });

            var inc = await BuildMedicationIncompatibilityAgainstCartAsync(userId, productId);

            return Ok(new
            {
                hasMedicationConflict = inc.Medications.Any(),
                incompatibilities = inc
            });
        }

        // =====================================================
        // POST /api/cart/{productId}?userId=5&qty=2&forceAdd=true
        // =====================================================
        [HttpPost("{productId:int}")]
        public async Task<IActionResult> AddToCart(
            int productId,
            [FromQuery] int userId,
            [FromQuery] int qty = 1,
            [FromQuery] bool forceAdd = false)
        {
            if (productId <= 0) return BadRequest(new { error = "Invalid productId" });
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });
            if (qty <= 0) return BadRequest(new { error = "Invalid qty" });

            try
            {
                // 1) medication interaction vs current cart
                var inc = await BuildMedicationIncompatibilityAgainstCartAsync(userId, productId);

                if (!forceAdd && inc.Medications.Any())
                {
                    return Conflict(new
                    {
                        requiresConfirmation = true,
                        reason = "MEDICATION_INTERACTION",
                        incompatibilities = inc
                    });
                }

                // 2) normal add-to-cart
                var (added, reason) = await _cartRepository.AddAsync(userId, productId, qty);

                if (!added && (reason == "OUT_OF_STOCK" || reason == "EXCEEDS_AVAILABLE_STOCK"))
                    return Conflict(new { added, reason });

                return Ok(new
                {
                    added,
                    reason,
                    incompatibilities = inc
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Cart add failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // =====================================================
        // PUT /api/cart/{productId}?userId=5&qty=3
        // =====================================================
        [HttpPut("{productId:int}")]
        public async Task<IActionResult> UpdateQty(
            int productId,
            [FromQuery] int userId,
            [FromQuery] int qty)
        {
            if (productId <= 0) return BadRequest(new { error = "Invalid productId" });
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var (updated, reason) = await _cartRepository.UpdateQtyAsync(userId, productId, qty);

                if (!updated && (reason == "OUT_OF_STOCK" || reason == "EXCEEDS_AVAILABLE_STOCK"))
                    return Conflict(new { updated, reason });

                if (!updated && reason == "NOT_FOUND")
                    return NotFound(new { updated, reason });

                return Ok(new { updated, reason });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Cart update failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // =====================================================
        // DELETE /api/cart/{productId}?userId=5
        // =====================================================
        [HttpDelete("{productId:int}")]
        public async Task<IActionResult> RemoveFromCart(int productId, [FromQuery] int userId)
        {
            if (productId <= 0) return BadRequest(new { error = "Invalid productId" });
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var removed = await _cartRepository.RemoveAsync(userId, productId);
                return Ok(new { removed });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Cart remove failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // =====================================================
        // DELETE /api/cart/clear?userId=5
        // =====================================================
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart([FromQuery] int userId)
        {
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var removedCount = await _cartRepository.ClearAsync(userId);
                return Ok(new { removedCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Cart clear failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // =====================================================
        // HELPER: Medication incompatibility vs cart
        // =====================================================
        private async Task<CustomerIncompatibilitiesDto> BuildMedicationIncompatibilityAgainstCartAsync(int userId, int newProductId)
        {
            List<CartItemDto> cartItems = await _cartRepository.GetMyAsync(userId);

            var existingProductIds = cartItems
                .Select(x => x.ProductId)
                .Where(pid => pid > 0 && pid != newProductId)
                .Distinct()
                .ToList();

            if (existingProductIds.Count == 0)
                return new CustomerIncompatibilitiesDto();

            var nameMap = await _context.Products
                .Where(p => existingProductIds.Contains(p.ProductId))
                .Select(p => new { p.ProductId, p.ProductName })
                .ToDictionaryAsync(x => x.ProductId, x => x.ProductName ?? "Unknown");

            var result = new CustomerIncompatibilitiesDto();

            foreach (var otherId in existingProductIds)
            {
                var check = await _safetyCheckRepository.CheckProductInteractionsAsync(newProductId, otherId);

                if (check != null && check.HasInteraction)
                {
                    var otherName = nameMap.TryGetValue(otherId, out var name) ? name : "Unknown";

                    result.Medications.Add(new MedicationConflictDto
                    {
                        OtherProductId = otherId,
                        OtherProductName = otherName,
                        Message = check.Message ?? "Medication interaction detected."
                    });
                }
            }

            return result;
        }

        // =====================================================
        // HELPER: Illness incompatibility map (health profile)
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

        // =====================================================
        // HELPER: Allergy incompatibility map (health profile)
        // =====================================================
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
