using AutoMapper;
using Microsoft.EntityFrameworkCore;
using AbilityHub.Usage.Entities;

namespace AbilityHub.Usage.Repositories
{
    public class UsageRepository(UsageDbContext context, ILogger<UsageRepository> logger, IMapper mapper) : IUsageRepository
    {
        private readonly UsageDbContext _context = context;
        private readonly ILogger<UsageRepository> _logger = logger;
        private readonly IMapper _mapper = mapper;

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
                _mapper.Map(activity, existing);
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

        public async Task<IReadOnlyList<AppUsageAggregate>> GetPerAppAggregatesAsync(IReadOnlyCollection<Guid>? childIds, DateTime sinceUtc, DateTime? untilUtc = null, IReadOnlyCollection<Guid>? applicationIds = null)
            => await _context.UsageSessions
                .AsNoTracking()
                .Where(s => childIds == null || childIds.Contains(s.ChildId))
                .Where(s => s.StartedAt >= sinceUtc)
                .Where(s => untilUtc == null || s.StartedAt < untilUtc)
                .Where(s => applicationIds == null || applicationIds.Contains(s.ApplicationId))
                .GroupBy(s => s.ApplicationId)
                .Select(g => new AppUsageAggregate(
                    g.Key,
                    g.Count(),
                    g.Sum(s => (long)s.DurationSeconds),
                    g.Max(s => s.EndedAt)))
                .ToListAsync();

        public async Task<IReadOnlyList<ActivityRecord>> GetRecentActivitiesAsync(IReadOnlyCollection<Guid>? childIds, int limit, IReadOnlyCollection<Guid>? applicationIds = null)
            => await _context.ActivityRecords
                .Where(a => childIds == null || childIds.Contains(a.ChildId))
                .Where(a => applicationIds == null || applicationIds.Contains(a.ApplicationId))
                .OrderByDescending(a => a.OccurredAt)
                .Take(limit)
                .AsNoTracking()
                .ToListAsync();

        public async Task<int> GetActivityCountAsync(IReadOnlyCollection<Guid>? childIds, IReadOnlyCollection<Guid>? applicationIds = null)
            => await _context.ActivityRecords
                .AsNoTracking()
                .Where(a => childIds == null || childIds.Contains(a.ChildId))
                .Where(a => applicationIds == null || applicationIds.Contains(a.ApplicationId))
                .CountAsync();

        public async Task<long> GetUsageSecondsSinceAsync(Guid childId, Guid applicationId, DateTime sinceUtc)
            => await _context.UsageSessions
                .AsNoTracking()
                .Where(s => s.ChildId == childId && s.ApplicationId == applicationId && s.StartedAt >= sinceUtc)
                .SumAsync(s => (long)s.DurationSeconds);

        public async Task<IReadOnlyList<DailyUsage>> GetDailyUsageSinceAsync(IReadOnlyCollection<Guid>? childIds, DateTime sinceUtc, DateTime? untilUtc = null, IReadOnlyCollection<Guid>? applicationIds = null)
            => await _context.UsageSessions
                .AsNoTracking()
                .Where(s => childIds == null || childIds.Contains(s.ChildId))
                .Where(s => s.StartedAt >= sinceUtc)
                .Where(s => untilUtc == null || s.StartedAt < untilUtc)
                .Where(s => applicationIds == null || applicationIds.Contains(s.ApplicationId))
                .GroupBy(s => s.StartedAt.Date)
                .Select(g => new DailyUsage(g.Key, g.Sum(s => (long)s.DurationSeconds)))
                .ToListAsync();

        public async Task<IReadOnlyList<StepCompletion>> GetStepCompletionsAsync(IReadOnlyCollection<Guid>? childIds, IReadOnlyCollection<Guid>? applicationIds = null)
            => await _context.ActivityRecords
                .AsNoTracking()
                .Where(a => childIds == null || childIds.Contains(a.ChildId))
                .Where(a => applicationIds == null || applicationIds.Contains(a.ApplicationId))
                .Where(a => a.StepsCompleted != null && a.StepsTotal != null && a.StepsTotal > 0)
                .Select(a => new StepCompletion(a.StepsCompleted!.Value, a.StepsTotal!.Value))
                .ToListAsync();

        public async Task<IReadOnlyList<DailyActivityMetrics>> GetDailyActivityMetricsAsync(IReadOnlyCollection<Guid>? childIds, DateTime sinceUtc, DateTime? untilUtc = null, IReadOnlyCollection<Guid>? applicationIds = null)
            => await _context.ActivityRecords
                .AsNoTracking()
                .Where(a => childIds == null || childIds.Contains(a.ChildId))
                .Where(a => a.OccurredAt >= sinceUtc)
                .Where(a => untilUtc == null || a.OccurredAt < untilUtc)
                .Where(a => applicationIds == null || applicationIds.Contains(a.ApplicationId))
                .GroupBy(a => a.OccurredAt.Date)
                .Select(g => new DailyActivityMetrics(
                    g.Key,
                    g.Sum(a => a.HintsShown ?? 0),
                    // Completed: explicitly finished, or every step done.
                    g.Count(a => a.CompletedViaAction == true
                        || (a.StepsTotal != null && a.StepsTotal > 0 && a.StepsCompleted == a.StepsTotal)),
                    // Not completed: a finished attempt that didn't reach the end (in-progress excluded).
                    g.Count(a => a.InProgress == false
                        && !(a.CompletedViaAction == true
                            || (a.StepsTotal != null && a.StepsTotal > 0 && a.StepsCompleted == a.StepsTotal))),
                    g.Sum(a => a.ErrorsCount ?? 0)))
                .ToListAsync();

        public async Task<IReadOnlyList<DateTime>> GetActiveDaysSinceAsync(
            IReadOnlyCollection<Guid>? childIds, DateTime sinceUtc, IReadOnlyCollection<Guid>? applicationIds = null, DateTime? untilUtc = null)
            => await _context.ActivityRecords
                .AsNoTracking()
                .Where(a => childIds == null || childIds.Contains(a.ChildId))
                .Where(a => a.OccurredAt >= sinceUtc)
                .Where(a => untilUtc == null || a.OccurredAt < untilUtc)
                .Where(a => applicationIds == null || applicationIds.Contains(a.ApplicationId))
                .Select(a => a.OccurredAt.Date)
                .Distinct()
                .ToListAsync();

        public async Task<IReadOnlyList<ActivityRecord>> GetActivitiesOnDateAsync(
            IReadOnlyCollection<Guid>? childIds, DateTime date, IReadOnlyCollection<Guid>? applicationIds = null)
        {
            var start = date.Date;
            var end = start.AddDays(1);
            return await _context.ActivityRecords
                .AsNoTracking()
                .Where(a => childIds == null || childIds.Contains(a.ChildId))
                .Where(a => a.OccurredAt >= start && a.OccurredAt < end)
                .Where(a => applicationIds == null || applicationIds.Contains(a.ApplicationId))
                .OrderByDescending(a => a.OccurredAt)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<ChildStepCompletion>> GetStepCompletionsByChildAsync(IReadOnlyCollection<Guid>? childIds)
            => await _context.ActivityRecords
                .AsNoTracking()
                .Where(a => childIds == null || childIds.Contains(a.ChildId))
                .Where(a => a.StepsCompleted != null && a.StepsTotal != null && a.StepsTotal > 0)
                .Select(a => new ChildStepCompletion(a.ChildId, a.StepsCompleted!.Value, a.StepsTotal!.Value))
                .ToListAsync();

        public async Task<int> GetActiveChildrenCountSinceAsync(DateTime sinceUtc, IReadOnlyCollection<Guid>? childIds = null)
            => await _context.ActivityRecords
                .AsNoTracking()
                .Where(a => childIds == null || childIds.Contains(a.ChildId))
                .Where(a => a.OccurredAt >= sinceUtc)
                .Select(a => a.ChildId)
                .Distinct()
                .CountAsync();
    }
}
