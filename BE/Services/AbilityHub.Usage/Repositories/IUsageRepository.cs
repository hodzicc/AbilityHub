using AbilityHub.Usage.Entities;

namespace AbilityHub.Usage.Repositories
{
    public record AppUsageAggregate(Guid ApplicationId, int SessionCount, long TotalSeconds, DateTime LastUsedAt);

    /// <summary>Step-completion pair for a single activity (both non-null, Total &gt; 0).</summary>
    public record StepCompletion(int Completed, int Total);

    /// <summary>Total usage seconds on a single (UTC) calendar day.</summary>
    public record DailyUsage(DateTime Date, long TotalSeconds);

    public interface IUsageRepository
    {
        Task AddSessionAsync(UsageSession session);

        /// <summary>
        /// Inserts the session, or updates it in place if one with the same id already
        /// exists for the same child (used by the app's foreground-time heartbeat).
        /// A session id owned by a different child is ignored (no cross-child writes).
        /// </summary>
        Task UpsertSessionAsync(UsageSession session);

        Task AddActivitiesAsync(IEnumerable<ActivityRecord> activities);

        /// <summary>
        /// Inserts the activity, or updates it in place if one with the same id exists
        /// for the same child — used for live step-by-step progress updates. An id
        /// owned by a different child is ignored.
        /// </summary>
        Task UpsertActivityAsync(ActivityRecord activity);

        /// <summary>
        /// Per-app totals for a child (time, session count, last used) over sessions
        /// started on/after <paramref name="sinceUtc"/>, optionally restricted to one
        /// set of application ids (used for category filtering, since app category
        /// lives in AppRegistry and is resolved by the caller).
        /// </summary>
        Task<IReadOnlyList<AppUsageAggregate>> GetPerAppAggregatesAsync(Guid childId, DateTime sinceUtc, IReadOnlyCollection<Guid>? applicationIds = null);

        /// <summary>Most recent activities for a child, optionally restricted to a set of application ids.</summary>
        Task<IReadOnlyList<ActivityRecord>> GetRecentActivitiesAsync(Guid childId, int limit, IReadOnlyCollection<Guid>? applicationIds = null);

        Task<int> GetActivityCountAsync(Guid childId, IReadOnlyCollection<Guid>? applicationIds = null);

        /// <summary>Seconds of usage for a (child, app) since <paramref name="sinceUtc"/>.</summary>
        Task<long> GetUsageSecondsSinceAsync(Guid childId, Guid applicationId, DateTime sinceUtc);

        /// <summary>
        /// Total usage seconds per UTC day for a child since <paramref name="sinceUtc"/>
        /// (only days with usage are returned), optionally restricted to a set of apps.
        /// </summary>
        Task<IReadOnlyList<DailyUsage>> GetDailyUsageSinceAsync(Guid childId, DateTime sinceUtc, IReadOnlyCollection<Guid>? applicationIds = null);

        /// <summary>Step-completion pairs across activities that reported steps (for avg progress).</summary>
        Task<IReadOnlyList<StepCompletion>> GetStepCompletionsAsync(Guid childId, IReadOnlyCollection<Guid>? applicationIds = null);

        /// <summary>Distinct UTC dates on which the child completed any activity since <paramref name="sinceUtc"/>.</summary>
        Task<IReadOnlyList<DateTime>> GetActiveDaysSinceAsync(Guid childId, DateTime sinceUtc, IReadOnlyCollection<Guid>? applicationIds = null);
    }
}
