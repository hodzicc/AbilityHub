using AbilityHub.Usage.Entities;

namespace AbilityHub.Usage.Repositories
{
    public record AppUsageAggregate(Guid ApplicationId, int SessionCount, long TotalSeconds, DateTime LastUsedAt);

    /// <summary>Step-completion pair for a single activity (both non-null, Total &gt; 0).</summary>
    public record StepCompletion(int Completed, int Total);

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

        /// <summary>Per-app totals for a child (time, session count, last used).</summary>
        Task<IReadOnlyList<AppUsageAggregate>> GetPerAppAggregatesAsync(Guid childId);

        /// <summary>Most recent activities for a child, optionally limited to one activity type.</summary>
        Task<IReadOnlyList<ActivityRecord>> GetRecentActivitiesAsync(Guid childId, int limit, string? activityType = null);

        Task<int> GetActivityCountAsync(Guid childId, string? activityType = null);

        /// <summary>Seconds of usage for a (child, app) since <paramref name="sinceUtc"/>.</summary>
        Task<long> GetUsageSecondsSinceAsync(Guid childId, Guid applicationId, DateTime sinceUtc);

        /// <summary>Step-completion pairs across activities that reported steps (for avg progress).</summary>
        Task<IReadOnlyList<StepCompletion>> GetStepCompletionsAsync(Guid childId, string? activityType = null);

        /// <summary>Distinct UTC dates on which the child completed any activity since <paramref name="sinceUtc"/>.</summary>
        Task<IReadOnlyList<DateTime>> GetActiveDaysSinceAsync(Guid childId, DateTime sinceUtc, string? activityType = null);
    }
}
