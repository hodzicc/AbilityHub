using AbilityHub.Usage.Entities;

namespace AbilityHub.Usage.Repositories
{
    public record AppUsageAggregate(Guid ApplicationId, int SessionCount, long TotalSeconds, DateTime LastUsedAt);

    /// <summary>Step-completion pair for a single activity (both non-null, Total &gt; 0).</summary>
    public record StepCompletion(int Completed, int Total);

    /// <summary>Per-day rollup of activity outcome metrics for the metrics chart.
    /// Hints/StepBacks are summed across all activities that day; Completed/NotCompleted
    /// count finished attempts (an in-progress attempt counts toward neither).</summary>
    public record DailyActivityMetrics(DateTime Date, int Hints, int Completed, int NotCompleted, int StepBacks);

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
        /// started in [<paramref name="sinceUtc"/>, <paramref name="untilUtc"/>) — pass
        /// null for <paramref name="untilUtc"/> for an open-ended window. Optionally
        /// restricted to one set of application ids (used for category filtering, since
        /// app category lives in AppRegistry and is resolved by the caller).
        /// </summary>
        Task<IReadOnlyList<AppUsageAggregate>> GetPerAppAggregatesAsync(Guid childId, DateTime sinceUtc, DateTime? untilUtc = null, IReadOnlyCollection<Guid>? applicationIds = null);

        /// <summary>Most recent activities for a child, optionally restricted to a set of application ids.</summary>
        Task<IReadOnlyList<ActivityRecord>> GetRecentActivitiesAsync(Guid childId, int limit, IReadOnlyCollection<Guid>? applicationIds = null);

        Task<int> GetActivityCountAsync(Guid childId, IReadOnlyCollection<Guid>? applicationIds = null);

        /// <summary>Seconds of usage for a (child, app) since <paramref name="sinceUtc"/>.</summary>
        Task<long> GetUsageSecondsSinceAsync(Guid childId, Guid applicationId, DateTime sinceUtc);

        /// <summary>
        /// Total usage seconds per UTC day for a child over [<paramref name="sinceUtc"/>,
        /// <paramref name="untilUtc"/>) (only days with usage are returned; pass null for
        /// <paramref name="untilUtc"/> for an open-ended window), optionally restricted to a set of apps.
        /// </summary>
        Task<IReadOnlyList<DailyUsage>> GetDailyUsageSinceAsync(Guid childId, DateTime sinceUtc, DateTime? untilUtc = null, IReadOnlyCollection<Guid>? applicationIds = null);

        /// <summary>Step-completion pairs across activities that reported steps (for avg progress).</summary>
        Task<IReadOnlyList<StepCompletion>> GetStepCompletionsAsync(Guid childId, IReadOnlyCollection<Guid>? applicationIds = null);

        /// <summary>
        /// Per-UTC-day activity outcome metrics (hints, completed, not-completed, step-backs)
        /// over [<paramref name="sinceUtc"/>, <paramref name="untilUtc"/>); only days with
        /// activity are returned. Optionally restricted to a set of apps.
        /// </summary>
        Task<IReadOnlyList<DailyActivityMetrics>> GetDailyActivityMetricsAsync(Guid childId, DateTime sinceUtc, DateTime? untilUtc = null, IReadOnlyCollection<Guid>? applicationIds = null);

        /// <summary>Distinct UTC dates on which the child completed any activity in
        /// [<paramref name="sinceUtc"/>, <paramref name="untilUtc"/>) — pass null for
        /// <paramref name="untilUtc"/> for an open-ended window (e.g. the 90-day heatmap),
        /// or bound it to a specific calendar month (the statistics calendar view).</summary>
        Task<IReadOnlyList<DateTime>> GetActiveDaysSinceAsync(Guid childId, DateTime sinceUtc, IReadOnlyCollection<Guid>? applicationIds = null, DateTime? untilUtc = null);

        /// <summary>Every activity a child had on one specific UTC calendar day — backs the
        /// statistics calendar's day drill-down (unlike GetRecentActivitiesAsync, which is
        /// a fixed-size "most recent N" across all time, not scoped to one day).</summary>
        Task<IReadOnlyList<ActivityRecord>> GetActivitiesOnDateAsync(Guid childId, DateTime date, IReadOnlyCollection<Guid>? applicationIds = null);

        // ---- Platform-wide (admin) aggregates — same shape as the per-child queries
        // above, but computed across every child in one query instead of the caller
        // looping per child. ----

        /// <summary>Total usage seconds per UTC day across all children, over
        /// [<paramref name="sinceUtc"/>, <paramref name="untilUtc"/>).</summary>
        Task<IReadOnlyList<DailyUsage>> GetDailyUsageAllSinceAsync(DateTime sinceUtc, DateTime? untilUtc = null);

        /// <summary>Step-completion pairs across every child's activities that reported steps.</summary>
        Task<IReadOnlyList<StepCompletion>> GetStepCompletionsAllAsync();

        /// <summary>Most recent activities across all children.</summary>
        Task<IReadOnlyList<ActivityRecord>> GetRecentActivitiesAllAsync(int limit);

        /// <summary>Count of distinct children with any recorded activity since <paramref name="sinceUtc"/>.</summary>
        Task<int> GetActiveChildrenCountSinceAsync(DateTime sinceUtc);
    }
}
