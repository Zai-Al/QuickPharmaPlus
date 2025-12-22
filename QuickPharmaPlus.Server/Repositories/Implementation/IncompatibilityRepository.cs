// Repositories/Implementation/IncompatibilityRepository.cs
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Incompatibility;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class IncompatibilityRepository : IIncompatibilityRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public IncompatibilityRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        public async Task<Dictionary<int, CustomerIncompatibilitiesDto>> GetMapAsync(int userId, List<int> productIds)
        {
            var result = new Dictionary<int, CustomerIncompatibilitiesDto>();

            if (productIds == null || productIds.Count == 0)
                return result;

            productIds = productIds
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            if (productIds.Count == 0)
                return result;

            // init dictionary with empty DTOs (so caller can safely index)
            foreach (var pid in productIds)
                result[pid] = new CustomerIncompatibilitiesDto();

            // latest profile (or only one)
            var hpId = await _context.HealthProfiles
                .AsNoTracking()
                .Where(h => h.UserId == userId)
                .OrderByDescending(h => h.HealthProfileId)
                .Select(h => (int?)h.HealthProfileId)
                .FirstOrDefaultAsync();

            if (!hpId.HasValue)
                return result;

            // =========================
            // Allergies
            // =========================
            var allergyIds = await _context.HealthProfileAllergies
                .AsNoTracking()
                .Where(x => x.HealthProfileId == hpId.Value && x.AllergyId.HasValue)
                .Select(x => x.AllergyId!.Value)
                .Distinct()
                .ToListAsync();

            if (allergyIds.Count > 0)
            {
                var allergyRows = await (
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
                        Name = an.AllergyName1
                    }
                )
                .AsNoTracking()
                .ToListAsync();

                foreach (var g in allergyRows.GroupBy(x => x.ProductId))
                {
                    result[g.Key].Allergies = g
                        .Select(x => x.Name)
                        .Where(n => !string.IsNullOrWhiteSpace(n))
                        .Distinct()
                        .OrderBy(n => n)
                        .ToList();
                }
            }

            // =========================
            // Illnesses
            // =========================
            var illnessIds = await _context.HealthProfileIllnesses
                .AsNoTracking()
                .Where(x => x.HealthProfileId == hpId.Value && x.IllnessId.HasValue)
                .Select(x => x.IllnessId!.Value)
                .Distinct()
                .ToListAsync();

            if (illnessIds.Count > 0)
            {
                var illnessRows = await (
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
                        Name = iname.IllnessName1
                    }
                )
                .AsNoTracking()
                .ToListAsync();

                foreach (var g in illnessRows.GroupBy(x => x.ProductId))
                {
                    result[g.Key].Illnesses = g
                        .Select(x => x.Name)
                        .Where(n => !string.IsNullOrWhiteSpace(n))
                        .Distinct()
                        .OrderBy(n => n)
                        .ToList();
                }
            }

            // =========================
            // Medications (later)
            // =========================
            // result[pid].Medications stays empty for now (matches CustomerIncompatibilitiesDto)

            return result;
        }
    }
}
