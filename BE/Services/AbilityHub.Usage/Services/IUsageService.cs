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
    /// everything, and an empty collection returns nothing.
    /// </summary>
    Task<DashboardResponse> GetDashboardAsync(Guid childId, IReadOnlyCollection<Guid>? applicationIds = null);
    Task<LimitStatusResponse> GetLimitStatusAsync(Guid childId, Guid applicationId);
}
