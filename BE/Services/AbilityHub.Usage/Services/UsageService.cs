using AutoMapper;
using AbilityHub.ServiceClients;
using AbilityHub.Usage.Controllers.DTOs;
using AbilityHub.Usage.Entities;
using AbilityHub.Usage.Repositories;

namespace AbilityHub.Usage.Services;

public class UsageService(IUsageRepository repository, ISettingsServiceClient settingsClient, IMapper mapper) : IUsageService
{
    private const int RecentActivityLimit = 20;
    private const int ConsistencyWindowDays = 7;

    private readonly IUsageRepository _repository = repository;
    private readonly ISettingsServiceClient _settingsClient = settingsClient;
    private readonly IMapper _mapper = mapper;

    public async Task ReportAsync(Guid childId, UsageReportRequest report)
    {
        if (report.Session is { } session)
        {
            var duration = (int)Math.Max(0, (session.EndedAt - session.StartedAt).TotalSeconds);

            var record = new UsageSession
            {
                Id = session.Id ?? Guid.NewGuid(),
                ChildId = childId,
                ApplicationId = report.ApplicationId,
                StartedAt = session.StartedAt,
                EndedAt = session.EndedAt,
                DurationSeconds = duration,
                ReportedAt = DateTime.UtcNow
            };

            // With an id, the app is heart-beating one foreground period — update in
            // place; without one, it's a discrete one-shot session — insert.
            if (session.Id.HasValue)
                await _repository.UpsertSessionAsync(record);
            else
                await _repository.AddSessionAsync(record);
        }

        if (report.Activities.Count > 0)
        {
            // Activities carrying an id are live progress updates (upsert one row as
            // the child advances); the rest are one-shot completed activities (insert).
            var toInsert = new List<ActivityRecord>();

            foreach (var a in report.Activities)
            {
                var record = _mapper.Map<ActivityRecord>(a);
                record.ChildId = childId;
                record.ApplicationId = report.ApplicationId;

                if (a.Id.HasValue)
                    await _repository.UpsertActivityAsync(record);
                else
                    toInsert.Add(record);
            }

            if (toInsert.Count > 0)
                await _repository.AddActivitiesAsync(toInsert);
        }
    }

    public async Task<DashboardResponse> GetDashboardAsync(Guid childId, string? activityType = null)
    {
        var filter = string.IsNullOrWhiteSpace(activityType) ? null : activityType;

        var perApp = await _repository.GetPerAppAggregatesAsync(childId);
        var recent = await _repository.GetRecentActivitiesAsync(childId, RecentActivityLimit, filter);
        var activityCount = await _repository.GetActivityCountAsync(childId, filter);
        var stepCompletions = await _repository.GetStepCompletionsAsync(childId, filter);
        var activeDays = await _repository.GetActiveDaysSinceAsync(
            childId, DateTime.UtcNow.Date.AddDays(-(ConsistencyWindowDays - 1)), filter);

        return new DashboardResponse
        {
            ChildId = childId,
            GeneratedAt = DateTime.UtcNow,
            TotalUsageMinutes = perApp.Sum(a => a.TotalSeconds) / 60,
            ActivityCount = activityCount,
            AvgProgressPercent = ComputeAvgProgressPercent(stepCompletions),
            WeeklyConsistency = ComputeWeeklyConsistency(activeDays),
            PerApp = _mapper.Map<List<AppUsageDto>>(perApp.OrderByDescending(a => a.TotalSeconds)),
            RecentActivities = _mapper.Map<List<RecentActivityDto>>(recent),
            Recommendations = BuildRecommendations(perApp, recent)
        };
    }

    // Average of per-activity step-completion ratios, as a 0–100 percentage. This is
    // the real progress signal the advisor asked for (completed sub-steps / total),
    // replacing the frontend's "apps with any usage" proxy.
    private static double? ComputeAvgProgressPercent(IReadOnlyList<StepCompletion> completions)
    {
        if (completions.Count == 0) return null;
        var avgRatio = completions.Average(c => (double)c.Completed / c.Total);
        return Math.Round(Math.Clamp(avgRatio, 0, 1) * 100, 1);
    }

    private static double? ComputeWeeklyConsistency(IReadOnlyList<DateTime> activeDays)
    {
        if (activeDays.Count == 0) return null;
        return Math.Round(Math.Min(activeDays.Count, ConsistencyWindowDays) / (double)ConsistencyWindowDays, 2);
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
