using AbilityHub.Usage.Controllers.DTOs;

namespace AbilityHub.Usage.Services;

public interface IUsageService
{
    Task ReportAsync(Guid childId, UsageReportRequest report);

    /// <summary>
    /// Aggregated dashboard for a child. Pass <paramref name="applicationIds"/> to scope
    /// every figure (usage time, recent activities, count, average progress, weekly
    /// consistency) to one set of applications — this is how the frontend's app-category
    /// filter (resolved client-side from AppRegistry data) is applied; null returns
    /// everything, and an empty collection returns nothing. Pass <paramref name="fromUtc"/>/
    /// <paramref name="toUtc"/> to scope the per-app + daily usage window (e.g. paging through
    /// earlier weeks); both default to the last 7 days and are clamped to a 90-day lookback.
    /// </summary>
    Task<DashboardResponse> GetDashboardAsync(Guid childId, IReadOnlyCollection<Guid>? applicationIds = null, DateTime? fromUtc = null, DateTime? toUtc = null);

    /// <summary>Per-day activity outcome metrics (hints, completed, not-completed, step-backs)
    /// over the given window (defaults to the last 7 days, clamped to a 90-day lookback),
    /// optionally scoped to a set of apps.</summary>
    Task<DailyMetricsResponse> GetDailyMetricsAsync(Guid childId, IReadOnlyCollection<Guid>? applicationIds = null, DateTime? fromUtc = null, DateTime? toUtc = null);

    Task<LimitStatusResponse> GetLimitStatusAsync(Guid childId, Guid applicationId);
}
