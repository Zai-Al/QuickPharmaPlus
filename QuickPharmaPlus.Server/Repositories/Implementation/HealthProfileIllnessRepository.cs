using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.HealthProfile;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class HealthProfileIllnessRepository : IHealthProfileIllnessRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public HealthProfileIllnessRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        // Create HealthProfile automatically if it doesn't exist
        private async Task<HealthProfile> EnsureProfileAsync(int userId)
        {
            var hp = await _context.HealthProfiles
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (hp != null) return hp;

            hp = new HealthProfile { UserId = userId };
            _context.HealthProfiles.Add(hp);
            await _context.SaveChangesAsync();
            return hp;
        }

        public async Task<List<HealthProfileIllnessDto>> GetMyAsync(int userId)
        {
            var hp = await _context.HealthProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (hp == null) return new();

            var items = await (
                from hpi in _context.HealthProfileIllnesses
                join ill in _context.Illnesses on hpi.IllnessId equals ill.IllnessId
                join iname in _context.IllnessNames on ill.IllnessNameId equals iname.IllnessNameId
                join itype in _context.IllnessTypes on ill.LllnessTypeId equals itype.LllnessTypeId
                join sev in _context.Severities on hpi.SeverityId equals sev.SeverityId
                where hpi.HealthProfileId == hp.HealthProfileId
                orderby hpi.HealthProfileIllnessId descending
                select new HealthProfileIllnessDto
                {
                    HealthProfileIllnessId = hpi.HealthProfileIllnessId,

                    IllnessId = ill.IllnessId,

                    IllnessNameId = iname.IllnessNameId,
                    IllnessName = iname.IllnessName1,

                    IllnessTypeId = itype.LllnessTypeId,
                    IllnessTypeName = itype.IllnessTypeName,

                    SeverityId = sev.SeverityId,
                    SeverityName = sev.SeverityName
                }
            )
            .AsNoTracking()
            .ToListAsync();

            return items;
        }

        public async Task<bool> AddAsync(int userId, int illnessId, int severityId)
        {
            var hp = await EnsureProfileAsync(userId);

            // Ensure illness exists (optional but recommended)
            var illnessExists = await _context.Illnesses.AnyAsync(i => i.IllnessId == illnessId);
            if (!illnessExists) return false;

            var exists = await _context.HealthProfileIllnesses.AnyAsync(x =>
                x.HealthProfileId == hp.HealthProfileId &&
                x.IllnessId == illnessId);

            if (exists) return false;

            _context.HealthProfileIllnesses.Add(new HealthProfileIllness
            {
                HealthProfileId = hp.HealthProfileId,
                IllnessId = illnessId,
                SeverityId = severityId
            });

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateAsync(int userId, int healthProfileIllnessId, int illnessId, int severityId)
        {
            var hp = await _context.HealthProfiles
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (hp == null) return false;

            var row = await _context.HealthProfileIllnesses
                .FirstOrDefaultAsync(x =>
                    x.HealthProfileIllnessId == healthProfileIllnessId &&
                    x.HealthProfileId == hp.HealthProfileId);

            if (row == null) return false;

            var illnessExists = await _context.Illnesses.AnyAsync(i => i.IllnessId == illnessId);
            if (!illnessExists) return false;

            var duplicate = await _context.HealthProfileIllnesses.AnyAsync(x =>
                x.HealthProfileId == hp.HealthProfileId &&
                x.HealthProfileIllnessId != healthProfileIllnessId &&
                x.IllnessId == illnessId);

            if (duplicate) return false;

            row.IllnessId = illnessId;
            row.SeverityId = severityId;

            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<bool> RemoveAsync(int userId, int healthProfileIllnessId)
        {
            var hp = await _context.HealthProfiles
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (hp == null) return false;

            var row = await _context.HealthProfileIllnesses
                .FirstOrDefaultAsync(x =>
                    x.HealthProfileIllnessId == healthProfileIllnessId &&
                    x.HealthProfileId == hp.HealthProfileId);

            if (row == null) return false;

            _context.HealthProfileIllnesses.Remove(row);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
