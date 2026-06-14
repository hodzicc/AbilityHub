using Microsoft.EntityFrameworkCore;
using AbilityHub.Settings.Entities;

namespace AbilityHub.Settings.Repositories
{
    public class RestrictionRepository(SettingsDbContext context) : IRestrictionRepository
    {
        private readonly SettingsDbContext _context = context;

        public async Task<AppRestriction?> GetAsync(Guid childId, Guid applicationId)
            => await _context.AppRestrictions
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.ChildId == childId && r.ApplicationId == applicationId);

        public async Task UpsertAsync(AppRestriction restriction)
        {
            var current = await _context.AppRestrictions
                .FirstOrDefaultAsync(r => r.ChildId == restriction.ChildId && r.ApplicationId == restriction.ApplicationId);

            if (current is null)
            {
                _context.AppRestrictions.Add(restriction);
            }
            else
            {
                current.DailyTimeLimitMinutes = restriction.DailyTimeLimitMinutes;
                current.IsBlocked = restriction.IsBlocked;
                current.UpdatedByGuardianId = restriction.UpdatedByGuardianId;
                current.UpdatedAt = restriction.UpdatedAt;
            }

            await _context.SaveChangesAsync();
        }

        public async Task EnsureExistsAsync(Guid childId, Guid applicationId)
        {
            var exists = await _context.AppRestrictions
                .AnyAsync(r => r.ChildId == childId && r.ApplicationId == applicationId);

            if (exists)
                return;

            _context.AppRestrictions.Add(new AppRestriction
            {
                ChildId = childId,
                ApplicationId = applicationId,
                DailyTimeLimitMinutes = null,
                IsBlocked = false,
                UpdatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid childId, Guid applicationId)
        {
            await _context.AppRestrictions
                .Where(r => r.ChildId == childId && r.ApplicationId == applicationId)
                .ExecuteDeleteAsync();
        }
    }
}
