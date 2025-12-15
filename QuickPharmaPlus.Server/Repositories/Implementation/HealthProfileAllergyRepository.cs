using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.HealthProfile;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class HealthProfileAllergyRepository : IHealthProfileAllergyRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public HealthProfileAllergyRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        private async Task<HealthProfile> EnsureProfileAsync(int userId)
        {
            var hp = await _context.HealthProfiles.FirstOrDefaultAsync(x => x.UserId == userId);
            if (hp != null) return hp;

            hp = new HealthProfile { UserId = userId };
            _context.HealthProfiles.Add(hp);
            await _context.SaveChangesAsync();
            return hp;
        }

        public async Task<List<HealthProfileAllergyDto>> GetMyAsync(int userId)
        {
            var hp = await _context.HealthProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (hp == null) return new();

            var items = await (
                from hpi in _context.HealthProfileAllergies
                join all in _context.Allergies on hpi.AllergyId equals all.AllergyId
                join aname in _context.AllergyNames on all.AlleryNameId equals aname.AlleryNameId
                join atype in _context.AllergyTypes on all.AlleryTypeId equals atype.AlleryTypeId
                join sev in _context.Severities on hpi.SeverityId equals sev.SeverityId
                where hpi.HealthProfileId == hp.HealthProfileId
                orderby hpi.HealthProfileAllergyId descending
                select new HealthProfileAllergyDto
                {
                    HealthProfileAllergyId = hpi.HealthProfileAllergyId,

                    AllergyId = all.AllergyId,

                    AllergyNameId = aname.AlleryNameId,
                    AllergyName = aname.AllergyName1,

                    AllergyTypeId = atype.AlleryTypeId,
                    AllergyTypeName = atype.AllerTypeName,

                    SeverityId = sev.SeverityId,
                    SeverityName = sev.SeverityName
                }
            )
            .AsNoTracking()
            .ToListAsync();

            return items;
        }

        public async Task<bool> AddAsync(int userId, int allergyId, int severityId)
        {
            var hp = await EnsureProfileAsync(userId);


            var allergyExists = await _context.Allergies.AnyAsync(i => i.AllergyId == allergyId);
            if (!allergyExists) return false;

            var exists = await _context.HealthProfileAllergies.AnyAsync(x =>
                x.HealthProfileId == hp.HealthProfileId &&
                x.AllergyId == allergyId);

            if (exists) return false;

            _context.HealthProfileAllergies.Add(new HealthProfileAllergy
            {
                HealthProfileId = hp.HealthProfileId,
                AllergyId = allergyId,
                SeverityId = severityId
            });

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateAsync(int userId, int healthProfileAllergyId, int allergyId, int severityId)
        {
            var hp = await _context.HealthProfiles
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (hp == null) return false;

            var row = await _context.HealthProfileAllergies
                .FirstOrDefaultAsync(x =>
                    x.HealthProfileAllergyId == healthProfileAllergyId &&
                    x.HealthProfileId == hp.HealthProfileId);

            if (row == null) return false;

            var allergyExists = await _context.Allergies.AnyAsync(i => i.AllergyId == allergyId);
            if (!allergyExists) return false;

            var duplicate = await _context.HealthProfileAllergies.AnyAsync(x =>
                x.HealthProfileId == hp.HealthProfileId &&
                x.HealthProfileAllergyId != healthProfileAllergyId &&
                x.AllergyId == allergyId);

            if (duplicate) return false;

            row.AllergyId = allergyId;
            row.SeverityId = severityId;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveAsync(int userId, int healthProfileAllergyId)
        {
            var hp = await _context.HealthProfiles
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (hp == null) return false;

            var row = await _context.HealthProfileAllergies
                .FirstOrDefaultAsync(x =>
                    x.HealthProfileAllergyId == healthProfileAllergyId &&
                    x.HealthProfileId == hp.HealthProfileId);

            if (row == null) return false;

            _context.HealthProfileAllergies.Remove(row);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
