using AbilityHub.Usage.Controllers.DTOs;

namespace AbilityHub.Usage.Services;

public interface IUsageService
{
    Task ReportAsync(Guid childId, UsageReportRequest report);

    /// <summary>
    /// Aggregated dashboard for a child. Pass <paramref name="activityType"/> to scope
    /// the activity-based figures (recent activities, count, average progress,
    /// weekly consistency) to a single activity type; null returns everything.
    /// </summary>
    Task<DashboardResponse> GetDashboardAsync(Guid childId, string? activityType = null);
    Task<LimitStatusResponse> GetLimitStatusAsync(Guid childId, Guid applicationId);
}
