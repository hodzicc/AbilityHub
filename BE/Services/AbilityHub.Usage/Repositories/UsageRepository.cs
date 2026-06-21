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

        public async Task UpsertSessionAsync(UsageSession session)
        {
            var existing = await _context.UsageSessions.FirstOrDefaultAsync(s => s.Id == session.Id);

            if (existing is null)
            {
                await _context.UsageSessions.AddAsync(session);
            }
            else if (existing.ChildId == session.ChildId)
            {
                // Same continuous period reported again — extend it.
                existing.EndedAt = session.EndedAt;
                existing.DurationSeconds = session.DurationSeconds;
                existing.ReportedAt = session.ReportedAt;
            }
            else
            {
                // Id belongs to another child; never overwrite across users.
                return;
            }

            await _context.SaveChangesAsync();
        }

        public async Task AddActivitiesAsync(IEnumerable<ActivityRecord> activities)
        {
            await _context.ActivityRecords.AddRangeAsync(activities);
            await _context.SaveChangesAsync();
        }

        public async Task UpsertActivityAsync(ActivityRecord activity)
        {
            var existing = await _context.ActivityRecords.FirstOrDefaultAsync(a => a.Id == activity.Id);

            if (existing is null)
            {
                await _context.ActivityRecords.AddAsync(activity);
            }
            else if (existing.ChildId == activity.ChildId)
            {
                // Same attempt, advanced a step — update its current state.
                existing.ActivityType = activity.ActivityType;
                existing.Name = activity.Name;
                existing.Score = activity.Score;
                existing.OccurredAt = activity.OccurredAt;
                existing.Detail = activity.Detail;
                existing.InProgress = activity.InProgress;
                existing.AttributesJson = activity.AttributesJson;
                existing.StartedViaAction = activity.StartedViaAction;
                existing.CompletedViaAction = activity.CompletedViaAction;
                existing.StepsCompleted = activity.StepsCompleted;
                existing.StepsTotal = activity.StepsTotal;
                existing.DurationSeconds = activity.DurationSeconds;
                existing.HintsShown = activity.HintsShown;
                existing.ErrorsCount = activity.ErrorsCount;
            }
            else
            {
                return; // id belongs to another child — never overwrite across users
            }

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

        public async Task<IReadOnlyList<ActivityRecord>> GetRecentActivitiesAsync(Guid childId, int limit, string? activityType = null)
            => await _context.ActivityRecords
                .Where(a => a.ChildId == childId)
                .Where(a => activityType == null || a.ActivityType == activityType)
                .OrderByDescending(a => a.OccurredAt)
                .Take(limit)
                .AsNoTracking()
                .ToListAsync();

        public async Task<int> GetActivityCountAsync(Guid childId, string? activityType = null)
            => await _context.ActivityRecords
                .Where(a => a.ChildId == childId)
                .Where(a => activityType == null || a.ActivityType == activityType)
                .CountAsync();

        public async Task<long> GetUsageSecondsSinceAsync(Guid childId, Guid applicationId, DateTime sinceUtc)
            => await _context.UsageSessions
                .Where(s => s.ChildId == childId && s.ApplicationId == applicationId && s.StartedAt >= sinceUtc)
                .SumAsync(s => (long)s.DurationSeconds);

        public async Task<IReadOnlyList<StepCompletion>> GetStepCompletionsAsync(Guid childId, string? activityType = null)
            => await _context.ActivityRecords
                .Where(a => a.ChildId == childId)
                .Where(a => activityType == null || a.ActivityType == activityType)
                .Where(a => a.StepsCompleted != null && a.StepsTotal != null && a.StepsTotal > 0)
                .Select(a => new StepCompletion(a.StepsCompleted!.Value, a.StepsTotal!.Value))
                .ToListAsync();

        public async Task<IReadOnlyList<DateTime>> GetActiveDaysSinceAsync(Guid childId, DateTime sinceUtc, string? activityType = null)
            => await _context.ActivityRecords
                .Where(a => a.ChildId == childId && a.OccurredAt >= sinceUtc)
                .Where(a => activityType == null || a.ActivityType == activityType)
                .Select(a => a.OccurredAt.Date)
                .Distinct()
                .ToListAsync();
    }
}
