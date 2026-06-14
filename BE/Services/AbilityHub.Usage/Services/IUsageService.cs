using AbilityHub.Usage.Controllers.DTOs;

namespace AbilityHub.Usage.Services;

public interface IUsageService
{
    Task ReportAsync(Guid childId, UsageReportRequest report);
    Task<DashboardResponse> GetDashboardAsync(Guid childId);
    Task<LimitStatusResponse> GetLimitStatusAsync(Guid childId, Guid applicationId);
}
