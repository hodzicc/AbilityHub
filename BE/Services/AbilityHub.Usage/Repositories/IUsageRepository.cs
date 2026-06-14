using AbilityHub.Usage.Entities;

namespace AbilityHub.Usage.Repositories
{
    public record AppUsageAggregate(Guid ApplicationId, int SessionCount, long TotalSeconds, DateTime LastUsedAt);

    public interface IUsageRepository
    {
        Task AddSessionAsync(UsageSession session);
        Task AddActivitiesAsync(IEnumerable<ActivityRecord> activities);

        /// <summary>Per-app totals for a child (time, session count, last used).</summary>
        Task<IReadOnlyList<AppUsageAggregate>> GetPerAppAggregatesAsync(Guid childId);

        /// <summary>Most recent activities for a child.</summary>
        Task<IReadOnlyList<ActivityRecord>> GetRecentActivitiesAsync(Guid childId, int limit);

        Task<int> GetActivityCountAsync(Guid childId);

        /// <summary>Seconds of usage for a (child, app) since <paramref name="sinceUtc"/>.</summary>
        Task<long> GetUsageSecondsSinceAsync(Guid childId, Guid applicationId, DateTime sinceUtc);
    }
}
