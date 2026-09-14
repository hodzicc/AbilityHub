using AbilityHub.Usage.Entities;

namespace AbilityHub.Usage.Repositories
{
    public record AppUsageAggregate(Guid ApplicationId, int SessionCount, long TotalSeconds, DateTime LastUsedAt);

    /// <summary>Step-completion pair for a single activity (both non-null, Total &gt; 0).</summary>
    public record StepCompletion(int Completed, int Total);

    /// <summary>A <see cref="StepCompletion"/> tagged with the child it belongs to, so
    /// per-child averages can be computed from one cross-child query.</summary>
    public record ChildStepCompletion(Guid ChildId, int Completed, int Total);

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

        // ---- Read queries over a SET of children. <c>childIds</c> null = every child
        // (the platform-wide admin view); a one-element set = one child (per-child views);
        // a larger set = a guardian's combined view. One generic shape serves all three,
        // so no query is duplicated per scope. <c>applicationIds</c> optionally narrows to
        // a set of apps (category filtering, resolved to app ids by the caller). ----

        /// <summary>
        /// Per-app totals (time, session count, last used) over sessions started in
        /// [<paramref name="sinceUtc"/>, <paramref name="untilUtc"/>) — pass null for
        /// <paramref name="untilUtc"/> for an open-ended window. Summed across the children.
        /// </summary>
        Task<IReadOnlyList<AppUsageAggregate>> GetPerAppAggregatesAsync(IReadOnlyCollection<Guid>? childIds, DateTime sinceUtc, DateTime? untilUtc = null, IReadOnlyCollection<Guid>? applicationIds = null);

        /// <summary>Most recent activities across the children, optionally restricted to a set of application ids.</summary>
        Task<IReadOnlyList<ActivityRecord>> GetRecentActivitiesAsync(IReadOnlyCollection<Guid>? childIds, int limit, IReadOnlyCollection<Guid>? applicationIds = null);

        Task<int> GetActivityCountAsync(IReadOnlyCollection<Guid>? childIds, IReadOnlyCollection<Guid>? applicationIds = null);

        /// <summary>Seconds of usage for a single (child, app) since <paramref name="sinceUtc"/> (daily limit tracking).</summary>
        Task<long> GetUsageSecondsSinceAsync(Guid childId, Guid applicationId, DateTime sinceUtc);

        /// <summary>
        /// Total usage seconds per UTC day over [<paramref name="sinceUtc"/>,
        /// <paramref name="untilUtc"/>) (only days with usage are returned; pass null for
        /// <paramref name="untilUtc"/> for an open-ended window), summed across the children.
        /// </summary>
        Task<IReadOnlyList<DailyUsage>> GetDailyUsageSinceAsync(IReadOnlyCollection<Guid>? childIds, DateTime sinceUtc, DateTime? untilUtc = null, IReadOnlyCollection<Guid>? applicationIds = null);

        /// <summary>Step-completion pairs across the children's activities that reported steps (for avg progress).</summary>
        Task<IReadOnlyList<StepCompletion>> GetStepCompletionsAsync(IReadOnlyCollection<Guid>? childIds, IReadOnlyCollection<Guid>? applicationIds = null);

        /// <summary>Step-completion pairs tagged with their child, across the given children
        /// (null = all), for computing each child's average progress in one query.</summary>
        Task<IReadOnlyList<ChildStepCompletion>> GetStepCompletionsByChildAsync(IReadOnlyCollection<Guid>? childIds);

        /// <summary>
        /// Per-UTC-day activity outcome metrics (hints, completed, not-completed, step-backs)
        /// over [<paramref name="sinceUtc"/>, <paramref name="untilUtc"/>); only days with
        /// activity are returned. Summed across the children.
        /// </summary>
        Task<IReadOnlyList<DailyActivityMetrics>> GetDailyActivityMetricsAsync(IReadOnlyCollection<Guid>? childIds, DateTime sinceUtc, DateTime? untilUtc = null, IReadOnlyCollection<Guid>? applicationIds = null);

        /// <summary>Distinct UTC dates on which any of the children completed an activity in
        /// [<paramref name="sinceUtc"/>, <paramref name="untilUtc"/>) — pass null for
        /// <paramref name="untilUtc"/> for an open-ended window (e.g. the 90-day heatmap),
        /// or bound it to a specific calendar month (the statistics calendar view).</summary>
        Task<IReadOnlyList<DateTime>> GetActiveDaysSinceAsync(IReadOnlyCollection<Guid>? childIds, DateTime sinceUtc, IReadOnlyCollection<Guid>? applicationIds = null, DateTime? untilUtc = null);

        /// <summary>Every activity the children had on one specific UTC calendar day — backs the
        /// statistics calendar's day drill-down (unlike GetRecentActivitiesAsync, which is
        /// a fixed-size "most recent N" across all time, not scoped to one day).</summary>
        Task<IReadOnlyList<ActivityRecord>> GetActivitiesOnDateAsync(IReadOnlyCollection<Guid>? childIds, DateTime date, IReadOnlyCollection<Guid>? applicationIds = null);

        /// <summary>Count of distinct children (within <paramref name="childIds"/>, or all
        /// if null) with any recorded activity since <paramref name="sinceUtc"/>.</summary>
        Task<int> GetActiveChildrenCountSinceAsync(DateTime sinceUtc, IReadOnlyCollection<Guid>? childIds = null);
    }
}
