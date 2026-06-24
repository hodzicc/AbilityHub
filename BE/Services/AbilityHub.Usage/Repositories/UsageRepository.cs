using Microsoft.EntityFrameworkCore;
using AbilityHub.Usage.Entities;

namespace AbilityHub.Usage.Repositories
{
    public class UsageRepository(UsageDbContext context, ILogger<UsageRepository> logger) : IUsageRepository
    {
        private readonly UsageDbContext _context = context;
        private readonly ILogger<UsageRepository> _logger = logger;

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
                _logger.LogWarning(
                    "Ignored session upsert for id {SessionId}: belongs to child {OwnerChildId}, not the reporting child {ReportingChildId}.",
                    session.Id, existing.ChildId, session.ChildId);
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
                _logger.LogWarning(
                    "Ignored activity upsert for id {ActivityId}: belongs to child {OwnerChildId}, not the reporting child {ReportingChildId}.",
                    activity.Id, existing.ChildId, activity.ChildId);
                return;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<AppUsageAggregate>> GetPerAppAggregatesAsync(Guid childId, IReadOnlyCollection<Guid>? applicationIds = null)
            => await _context.UsageSessions
                .AsNoTracking()
                .Where(s => s.ChildId == childId)
                .Where(s => applicationIds == null || applicationIds.Contains(s.ApplicationId))
                .GroupBy(s => s.ApplicationId)
                .Select(g => new AppUsageAggregate(
                    g.Key,
                    g.Count(),
                    g.Sum(s => (long)s.DurationSeconds),
                    g.Max(s => s.EndedAt)))
                .ToListAsync();

        public async Task<IReadOnlyList<ActivityRecord>> GetRecentActivitiesAsync(Guid childId, int limit, IReadOnlyCollection<Guid>? applicationIds = null)
            => await _context.ActivityRecords
                .Where(a => a.ChildId == childId)
                .Where(a => applicationIds == null || applicationIds.Contains(a.ApplicationId))
                .OrderByDescending(a => a.OccurredAt)
                .Take(limit)
                .AsNoTracking()
                .ToListAsync();

        public async Task<int> GetActivityCountAsync(Guid childId, IReadOnlyCollection<Guid>? applicationIds = null)
            => await _context.ActivityRecords
                .AsNoTracking()
                .Where(a => a.ChildId == childId)
                .Where(a => applicationIds == null || applicationIds.Contains(a.ApplicationId))
                .CountAsync();

        public async Task<long> GetUsageSecondsSinceAsync(Guid childId, Guid applicationId, DateTime sinceUtc)
            => await _context.UsageSessions
                .AsNoTracking()
                .Where(s => s.ChildId == childId && s.ApplicationId == applicationId && s.StartedAt >= sinceUtc)
                .SumAsync(s => (long)s.DurationSeconds);

        public async Task<IReadOnlyList<DailyUsage>> GetDailyUsageSinceAsync(Guid childId, DateTime sinceUtc, IReadOnlyCollection<Guid>? applicationIds = null)
            => await _context.UsageSessions
                .AsNoTracking()
                .Where(s => s.ChildId == childId && s.StartedAt >= sinceUtc)
                .Where(s => applicationIds == null || applicationIds.Contains(s.ApplicationId))
                .GroupBy(s => s.StartedAt.Date)
                .Select(g => new DailyUsage(g.Key, g.Sum(s => (long)s.DurationSeconds)))
                .ToListAsync();

        public async Task<IReadOnlyList<StepCompletion>> GetStepCompletionsAsync(Guid childId, IReadOnlyCollection<Guid>? applicationIds = null)
            => await _context.ActivityRecords
                .AsNoTracking()
                .Where(a => a.ChildId == childId)
                .Where(a => applicationIds == null || applicationIds.Contains(a.ApplicationId))
                .Where(a => a.StepsCompleted != null && a.StepsTotal != null && a.StepsTotal > 0)
                .Select(a => new StepCompletion(a.StepsCompleted!.Value, a.StepsTotal!.Value))
                .ToListAsync();

        public async Task<IReadOnlyList<DateTime>> GetActiveDaysSinceAsync(Guid childId, DateTime sinceUtc, IReadOnlyCollection<Guid>? applicationIds = null)
            => await _context.ActivityRecords
                .AsNoTracking()
                .Where(a => a.ChildId == childId && a.OccurredAt >= sinceUtc)
                .Where(a => applicationIds == null || applicationIds.Contains(a.ApplicationId))
                .Select(a => a.OccurredAt.Date)
                .Distinct()
                .ToListAsync();
    }
}
