using Microsoft.EntityFrameworkCore;
using AbilityHub.Usage.Entities;

namespace AbilityHub.Usage.Repositories
{
    public class UsageRepository(UsageDbContext context) : IUsageRepository
    {
        private readonly UsageDbContext _context = context;

        public async Task AddSessionAsync(UsageSession session)
        {
            await _context.UsageSessions.AddAsync(session);
            await _context.SaveChangesAsync();
        }

        public async Task AddActivitiesAsync(IEnumerable<ActivityRecord> activities)
        {
            await _context.ActivityRecords.AddRangeAsync(activities);
            await _context.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<AppUsageAggregate>> GetPerAppAggregatesAsync(Guid childId)
            => await _context.UsageSessions
                .Where(s => s.ChildId == childId)
                .GroupBy(s => s.ApplicationId)
                .Select(g => new AppUsageAggregate(
                    g.Key,
                    g.Count(),
                    g.Sum(s => (long)s.DurationSeconds),
                    g.Max(s => s.EndedAt)))
                .ToListAsync();

        public async Task<IReadOnlyList<ActivityRecord>> GetRecentActivitiesAsync(Guid childId, int limit)
            => await _context.ActivityRecords
                .Where(a => a.ChildId == childId)
                .OrderByDescending(a => a.OccurredAt)
                .Take(limit)
                .AsNoTracking()
                .ToListAsync();

        public async Task<int> GetActivityCountAsync(Guid childId)
            => await _context.ActivityRecords.CountAsync(a => a.ChildId == childId);

        public async Task<long> GetUsageSecondsSinceAsync(Guid childId, Guid applicationId, DateTime sinceUtc)
            => await _context.UsageSessions
                .Where(s => s.ChildId == childId && s.ApplicationId == applicationId && s.StartedAt >= sinceUtc)
                .SumAsync(s => (long)s.DurationSeconds);
    }
}
