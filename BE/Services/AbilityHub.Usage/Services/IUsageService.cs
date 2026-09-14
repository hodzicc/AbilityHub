using AbilityHub.Usage.Controllers.DTOs;

namespace AbilityHub.Usage.Services;

public interface IUsageService
{
    Task ReportAsync(Guid childId, UsageReportRequest report);

    /// <summary>
    /// Aggregated dashboard over a set of children — one child for a per-child view, or
    /// several for a guardian's combined view (figures summed, progress/consistency
    /// averaged). Pass <paramref name="applicationIds"/> to scope every figure to one set
    /// of applications (the frontend's app-category filter, resolved client-side from
    /// AppRegistry data); null returns everything, an empty collection returns nothing.
    /// Pass <paramref name="fromUtc"/>/<paramref name="toUtc"/> to scope the per-app + daily
    /// usage window (e.g. paging earlier weeks); both default to the last 7 days and are
    /// clamped to a 90-day lookback.
    /// </summary>
    Task<DashboardResponse> GetDashboardAsync(IReadOnlyCollection<Guid> childIds, IReadOnlyCollection<Guid>? applicationIds = null, DateTime? fromUtc = null, DateTime? toUtc = null);

    /// <summary>Per-day activity outcome metrics (hints, completed, not-completed, step-backs)
    /// over the given window (defaults to the last 7 days, clamped to a 90-day lookback),
    /// summed across the given children, optionally scoped to a set of apps.</summary>
    Task<DailyMetricsResponse> GetDailyMetricsAsync(IReadOnlyCollection<Guid> childIds, IReadOnlyCollection<Guid>? applicationIds = null, DateTime? fromUtc = null, DateTime? toUtc = null);

    Task<LimitStatusResponse> GetLimitStatusAsync(Guid childId, Guid applicationId);

    /// <summary>
    /// Usage snapshot aggregated in one backend pass across a set of children — pass
    /// null for the platform-wide admin view (every child), or a guardian's child ids
    /// for their combined view — so the client never fetches one dashboard per child.
    /// </summary>
    Task<AggregateDashboardResponse> GetAggregateDashboardAsync(IReadOnlyCollection<Guid>? childIds);

    /// <summary>Average step-completion progress per child across the given children
    /// (null = all), computed in one pass — for list views that show a progress figure
    /// per child without fetching each child's full dashboard.</summary>
    Task<IReadOnlyList<ChildProgressDto>> GetChildrenProgressAsync(IReadOnlyCollection<Guid>? childIds);

    /// <summary>Dates within the given calendar month (1-12) on which any of the given
    /// children had recorded activity — backs the statistics calendar view's month grid.</summary>
    Task<CalendarMonthResponse> GetCalendarMonthAsync(IReadOnlyCollection<Guid> childIds, int year, int month, IReadOnlyCollection<Guid>? applicationIds = null);

    /// <summary>Every activity the given children had on one specific day — backs the calendar's
    /// day drill-down (clicking e.g. 2026-07-03 lists everything done that day).</summary>
    Task<List<RecentActivityDto>> GetActivitiesOnDateAsync(IReadOnlyCollection<Guid> childIds, DateTime date, IReadOnlyCollection<Guid>? applicationIds = null);
}
