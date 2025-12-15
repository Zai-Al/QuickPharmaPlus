using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.HealthProfile;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class HealthProfileLookupRepository : IHealthProfileLookupRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public HealthProfileLookupRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        // CHANGED: needs userId so we can hide already-added illnesses
        public async Task<List<IllnessNameOptionDto>> GetIllnessNamesAsync(int? userId, int? includeIllnessNameId)
        {
            int? hpId = null;

            if (userId.HasValue && userId.Value > 0)
            {
                hpId = await _context.HealthProfiles
                    .Where(h => h.UserId == userId.Value)
                    .Select(h => (int?)h.HealthProfileId)
                    .FirstOrDefaultAsync();
            }

            var query =
                from ill in _context.Illnesses
                join iname in _context.IllnessNames on ill.IllnessNameId equals iname.IllnessNameId
                join itype in _context.IllnessTypes on ill.LllnessTypeId equals itype.LllnessTypeId
                where ill.IllnessNameId != null && ill.LllnessTypeId != null
                select new { iname.IllnessNameId, Name = iname.IllnessName1, TypeName = itype.IllnessTypeName };

            if (hpId.HasValue)
            {
                query =
                    from x in query
                    where
                        // keep it if not already selected by user...
                        !_context.HealthProfileIllnesses.Any(hpi =>
                            hpi.HealthProfileId == hpId.Value &&
                            _context.Illnesses.Any(i2 => i2.IllnessId == hpi.IllnessId && i2.IllnessNameId == x.IllnessNameId))
                        // ...OR it is the one currently being edited
                        || (includeIllnessNameId.HasValue && x.IllnessNameId == includeIllnessNameId.Value)
                    select x;
            }

            return await query
                .GroupBy(x => x.IllnessNameId)
                .Select(g => new IllnessNameOptionDto
                {
                    IllnessNameId = g.Key,
                    IllnessName = g.Max(z => z.Name) ?? "",
                    IllnessTypeName = g.Max(z => z.TypeName) ?? ""
                })
                .OrderBy(x => x.IllnessName)
                .ToListAsync();
        }


        // SAME 
        public async Task<List<SeverityOptionDto>> GetSeveritiesAsync()
        {
            return await _context.Severities
                .OrderBy(s => s.SeverityName)
                .Select(s => new SeverityOptionDto
                {
                    SeverityId = s.SeverityId,
                    SeverityName = s.SeverityName
                })
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<List<AllergyDto>> GetAllergyNamesAsync(int? userId, int? includeAllergyNameId)
        {
            int? hpId = null;

            if (userId.HasValue && userId.Value > 0)
            {
                hpId = await _context.HealthProfiles
                    .Where(h => h.UserId == userId.Value)
                    .Select(h => (int?)h.HealthProfileId)
                    .FirstOrDefaultAsync();
            }

            var query =
                from all in _context.Allergies
                join aname in _context.AllergyNames on all.AlleryNameId equals aname.AlleryNameId
                join atype in _context.AllergyTypes on all.AlleryTypeId equals atype.AlleryTypeId
                where all.AlleryNameId != null && all.AlleryTypeId != null
                select new { aname.AlleryNameId, Name = aname.AllergyName1, TypeName = atype.AllerTypeName };

            if (hpId.HasValue)
            {
                query =
                    from x in query
                    where
                        // keep it if not already selected by user...
                        !_context.HealthProfileAllergies.Any(hpi =>
                            hpi.HealthProfileId == hpId.Value &&
                            _context.Allergies.Any(i2 => i2.AllergyId == hpi.AllergyId && i2.AlleryNameId == x.AlleryNameId))
                        // ...OR it is the one currently being edited
                        || (includeAllergyNameId.HasValue && x.AlleryNameId == includeAllergyNameId.Value)
                    select x;
            }

            return await query
                .GroupBy(x => x.AlleryNameId)
                .Select(g => new AllergyDto
                {
                    AllergyNameId = g.Key,
                    AllergyName = g.Max(z => z.Name) ?? "",
                    AllergyTypeName = g.Max(z => z.TypeName) ?? ""
                })
                .OrderBy(x => x.AllergyName)
                .ToListAsync();
        }


    }
}
