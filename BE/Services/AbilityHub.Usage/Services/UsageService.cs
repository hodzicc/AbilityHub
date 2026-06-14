using AbilityHub.ServiceClients;
using AbilityHub.Usage.Controllers.DTOs;
using AbilityHub.Usage.Entities;
using AbilityHub.Usage.Repositories;

namespace AbilityHub.Usage.Services;

public class UsageService(IUsageRepository repository, ISettingsServiceClient settingsClient) : IUsageService
{
    private const int RecentActivityLimit = 20;

    private readonly IUsageRepository _repository = repository;
    private readonly ISettingsServiceClient _settingsClient = settingsClient;

    public async Task ReportAsync(Guid childId, UsageReportRequest report)
    {
        if (report.Session is { } session)
        {
            var duration = (int)Math.Max(0, (session.EndedAt - session.StartedAt).TotalSeconds);

            await _repository.AddSessionAsync(new UsageSession
            {
                Id = Guid.NewGuid(),
                ChildId = childId,
                ApplicationId = report.ApplicationId,
                StartedAt = session.StartedAt,
                EndedAt = session.EndedAt,
                DurationSeconds = duration,
                ReportedAt = DateTime.UtcNow
            });
        }

        if (report.Activities.Count > 0)
        {
            var records = report.Activities.Select(a => new ActivityRecord
            {
                Id = Guid.NewGuid(),
                ChildId = childId,
                ApplicationId = report.ApplicationId,
                ActivityType = a.ActivityType,
                Name = a.Name,
                Score = a.Score,
                OccurredAt = a.OccurredAt == default ? DateTime.UtcNow : a.OccurredAt,
                Detail = a.Detail
            });

            await _repository.AddActivitiesAsync(records);
        }
    }

    public async Task<DashboardResponse> GetDashboardAsync(Guid childId)
    {
        var perApp = await _repository.GetPerAppAggregatesAsync(childId);
        var recent = await _repository.GetRecentActivitiesAsync(childId, RecentActivityLimit);
        var activityCount = await _repository.GetActivityCountAsync(childId);

        return new DashboardResponse
        {
            ChildId = childId,
            GeneratedAt = DateTime.UtcNow,
            TotalUsageMinutes = perApp.Sum(a => a.TotalSeconds) / 60,
            ActivityCount = activityCount,
            PerApp = perApp
                .OrderByDescending(a => a.TotalSeconds)
                .Select(a => new AppUsageDto
                {
                    ApplicationId = a.ApplicationId,
                    SessionCount = a.SessionCount,
                    TotalMinutes = a.TotalSeconds / 60,
                    LastUsedAt = a.LastUsedAt
                }).ToList(),
            RecentActivities = recent.Select(a => new ActivityDto
            {
                ActivityType = a.ActivityType,
                Name = a.Name,
                Score = a.Score,
                OccurredAt = a.OccurredAt,
                Detail = a.Detail
            }).ToList(),
            Recommendations = BuildRecommendations(perApp, recent)
        };
    }

    public async Task<LimitStatusResponse> GetLimitStatusAsync(Guid childId, Guid applicationId)
    {
        var restriction = await _settingsClient.GetRestrictionAsync(childId, applicationId)
            ?? new RestrictionInfo(null, false);

        var todayStartUtc = DateTime.UtcNow.Date;
        var usedSeconds = await _repository.GetUsageSecondsSinceAsync(childId, applicationId, todayStartUtc);
        var usedMinutes = (int)(usedSeconds / 60);

        var limit = restriction.DailyTimeLimitMinutes;
        var remaining = limit.HasValue ? Math.Max(0, limit.Value - usedMinutes) : (int?)null;
        var limitReached = limit.HasValue && usedMinutes >= limit.Value;

        return new LimitStatusResponse
        {
            ChildId = childId,
            ApplicationId = applicationId,
            IsBlocked = restriction.IsBlocked,
            DailyLimitMinutes = limit,
            UsedTodayMinutes = usedMinutes,
            RemainingMinutes = remaining,
            LimitReached = limitReached
        };
    }

    // Simple rule-based recommendations — a placeholder for a richer recommender.
    private static List<string> BuildRecommendations(
        IReadOnlyList<AppUsageAggregate> perApp,
        IReadOnlyList<ActivityRecord> recent)
    {
        var recommendations = new List<string>();

        if (perApp.Count == 0)
        {
            recommendations.Add("No usage recorded yet — explore the assigned apps to get started.");
            return recommendations;
        }

        var leastUsed = perApp.OrderBy(a => a.TotalSeconds).First();
        recommendations.Add($"Try spending more time on application {leastUsed.ApplicationId} — it has the least usage so far.");

        var weakest = recent
            .Where(a => a.Score.HasValue)
            .GroupBy(a => a.ActivityType)
            .Select(g => new { Type = g.Key, Avg = g.Average(a => a.Score!.Value) })
            .OrderBy(x => x.Avg)
            .FirstOrDefault();

        if (weakest is not null)
            recommendations.Add($"Practice more '{weakest.Type}' activities (recent average score {weakest.Avg:0.0}).");

        return recommendations;
    }
}
