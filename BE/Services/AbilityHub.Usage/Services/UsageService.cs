using AutoMapper;
using AbilityHub.ServiceClients;
using AbilityHub.Usage.Controllers.DTOs;
using AbilityHub.Usage.Entities;
using AbilityHub.Usage.Repositories;

namespace AbilityHub.Usage.Services;

public class UsageService(
    IUsageRepository repository,
    ISettingsServiceClient settingsClient,
    IAppRegistryServiceClient appRegistryClient,
    IMapper mapper) : IUsageService
{
    private const int RecentActivityLimit = 20;
    private const int ConsistencyWindowDays = 7;
    private const int ActivityHeatmapWindowDays = 90;
    // Default usage window (per-app + daily) when the caller doesn't pass an explicit
    // range — a single 7-day week. The statistics page pages through earlier weeks via
    // the from/to parameters; the heatmap (90d) and consistency (7d) windows are fixed.
    private const int DefaultWindowDays = 7;
    // How far back the caller may page (matches the heatmap window). Requests for an
    // earlier start are clamped so we never scan unbounded history.
    private const int MaxWindowLookbackDays = 90;

    private readonly IUsageRepository _repository = repository;
    private readonly ISettingsServiceClient _settingsClient = settingsClient;
    private readonly IAppRegistryServiceClient _appRegistryClient = appRegistryClient;
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

    public async Task<DashboardResponse> GetDashboardAsync(
        IReadOnlyCollection<Guid> childIds, IReadOnlyCollection<Guid>? applicationIds = null, DateTime? fromUtc = null, DateTime? toUtc = null)
    {
        var today = DateTime.UtcNow.Date;
        var (windowStart, windowEnd, untilExclusive) = ResolveWindow(fromUtc, toUtc, today);

        var perApp = await _repository.GetPerAppAggregatesAsync(childIds, windowStart, untilExclusive, applicationIds);
        var recent = await _repository.GetRecentActivitiesAsync(childIds, RecentActivityLimit, applicationIds);
        var activityCount = await _repository.GetActivityCountAsync(childIds, applicationIds);
        var stepCompletions = await _repository.GetStepCompletionsAsync(childIds, applicationIds);
        var activeDays = await _repository.GetActiveDaysSinceAsync(
            childIds, today.AddDays(-(ConsistencyWindowDays - 1)), applicationIds);
        var heatmapDays = await _repository.GetActiveDaysSinceAsync(
            childIds, today.AddDays(-(ActivityHeatmapWindowDays - 1)), applicationIds);
        var dailyUsage = await _repository.GetDailyUsageSinceAsync(childIds, windowStart, untilExclusive, applicationIds);

        return new DashboardResponse
        {
            ChildId = SingleChildOrEmpty(childIds),
            GeneratedAt = DateTime.UtcNow,
            RangeStart = windowStart,
            RangeEnd = windowEnd,
            // Round up so any nonzero usage shows as at least 1 minute (matches AppUsageDto.TotalMinutes).
            TotalUsageMinutes = (perApp.Sum(a => a.TotalSeconds) + 59) / 60,
            ActivityCount = activityCount,
            AvgProgressPercent = ComputeAvgProgressPercent(stepCompletions),
            WeeklyConsistency = ComputeWeeklyConsistency(activeDays),
            PerApp = _mapper.Map<List<AppUsageDto>>(perApp.OrderByDescending(a => a.TotalSeconds)),
            RecentActivities = _mapper.Map<List<RecentActivityDto>>(recent),
            Recommendations = await BuildRecommendationsAsync(perApp, recent),
            ActiveDays = heatmapDays.ToList(),
            DailyUsage = BuildDailyUsage(dailyUsage, windowStart, windowEnd)
        };
    }

    public async Task<DailyMetricsResponse> GetDailyMetricsAsync(
        IReadOnlyCollection<Guid> childIds, IReadOnlyCollection<Guid>? applicationIds = null, DateTime? fromUtc = null, DateTime? toUtc = null)
    {
        var (windowStart, windowEnd, untilExclusive) = ResolveWindow(fromUtc, toUtc, DateTime.UtcNow.Date);
        var raw = await _repository.GetDailyActivityMetricsAsync(childIds, windowStart, untilExclusive, applicationIds);
        var byDate = raw.ToDictionary(d => d.Date.Date);

        var days = new List<DailyMetricsDayDto>();
        for (var date = windowStart; date <= windowEnd; date = date.AddDays(1))
        {
            byDate.TryGetValue(date, out var m);
            days.Add(new DailyMetricsDayDto
            {
                Date = date,
                Hints = m?.Hints ?? 0,
                Completed = m?.Completed ?? 0,
                NotCompleted = m?.NotCompleted ?? 0,
                StepBacks = m?.StepBacks ?? 0,
            });
        }

        return new DailyMetricsResponse
        {
            ChildId = SingleChildOrEmpty(childIds),
            RangeStart = windowStart,
            RangeEnd = windowEnd,
            Days = days,
        };
    }

    // Resolves the [start, end] usage window (inclusive UTC days) plus the exclusive
    // upper bound for queries. Defaults to the last 7 days; an explicit range is clamped
    // to the 90-day lookback so paging back through weeks can't scan unbounded history.
    private static (DateTime start, DateTime end, DateTime untilExclusive) ResolveWindow(DateTime? fromUtc, DateTime? toUtc, DateTime today)
    {
        var end = toUtc?.Date ?? today;
        if (end > today) end = today;
        var start = fromUtc?.Date ?? end.AddDays(-(DefaultWindowDays - 1));
        var earliest = today.AddDays(-(MaxWindowLookbackDays - 1));
        if (start < earliest) start = earliest;
        if (start > end) start = end;
        return (start, end, end.AddDays(1));
    }

    // Per-day usage across [windowStart, windowEnd], oldest → newest, every day present
    // (gaps filled with 0), each day's seconds rounded up to whole minutes. Gives the
    // dashboard a real per-day bar chart instead of a single "today" bar.
    private static List<DailyUsageDto> BuildDailyUsage(IReadOnlyList<DailyUsage> reported, DateTime windowStart, DateTime windowEnd)
    {
        var byDate = reported.ToDictionary(d => d.Date.Date, d => d.TotalSeconds);
        var result = new List<DailyUsageDto>();
        for (var date = windowStart; date <= windowEnd; date = date.AddDays(1))
        {
            var seconds = byDate.TryGetValue(date, out var s) ? s : 0;
            result.Add(new DailyUsageDto { Date = date, Minutes = (seconds + 59) / 60 });
        }
        return result;
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

    private const int AggregateRecentActivityLimit = 20;

    public async Task<AggregateDashboardResponse> GetAggregateDashboardAsync(IReadOnlyCollection<Guid>? childIds)
    {
        var today = DateTime.UtcNow.Date;
        var windowStart = today.AddDays(-(DefaultWindowDays - 1));

        var dailyUsage = await _repository.GetDailyUsageSinceAsync(childIds, windowStart);
        var stepCompletions = await _repository.GetStepCompletionsAsync(childIds);
        var recent = await _repository.GetRecentActivitiesAsync(childIds, AggregateRecentActivityLimit);
        var activeChildren = await _repository.GetActiveChildrenCountSinceAsync(windowStart, childIds);

        var byDate = dailyUsage.ToDictionary(d => d.Date.Date, d => d.TotalSeconds);

        return new AggregateDashboardResponse
        {
            GeneratedAt = DateTime.UtcNow,
            ActiveChildrenCount = activeChildren,
            TotalUsageMinutesToday = (byDate.GetValueOrDefault(today) + 59) / 60,
            AvgProgressPercent = ComputeAvgProgressPercent(stepCompletions),
            DailyUsage = BuildDailyUsage(dailyUsage, windowStart, today),
            RecentActivities = _mapper.Map<List<RecentActivityDto>>(recent),
        };
    }

    public async Task<IReadOnlyList<ChildProgressDto>> GetChildrenProgressAsync(IReadOnlyCollection<Guid>? childIds)
    {
        var completions = await _repository.GetStepCompletionsByChildAsync(childIds);

        return completions
            .GroupBy(c => c.ChildId)
            .Select(g => new ChildProgressDto
            {
                ChildId = g.Key,
                // Reuse the same per-activity ratio averaging the dashboard uses, per child.
                AvgProgressPercent = ComputeAvgProgressPercent(
                    g.Select(c => new StepCompletion(c.Completed, c.Total)).ToList()) ?? 0,
            })
            .ToList();
    }

    public async Task<CalendarMonthResponse> GetCalendarMonthAsync(
        IReadOnlyCollection<Guid> childIds, int year, int month, IReadOnlyCollection<Guid>? applicationIds = null)
    {
        var monthStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = monthStart.AddMonths(1);

        var activeDays = await _repository.GetActiveDaysSinceAsync(childIds, monthStart, applicationIds, monthEnd);

        return new CalendarMonthResponse
        {
            ChildId = SingleChildOrEmpty(childIds),
            Year = year,
            Month = month,
            ActiveDays = activeDays.ToList(),
        };
    }

    public async Task<List<RecentActivityDto>> GetActivitiesOnDateAsync(
        IReadOnlyCollection<Guid> childIds, DateTime date, IReadOnlyCollection<Guid>? applicationIds = null)
    {
        var activities = await _repository.GetActivitiesOnDateAsync(childIds, date, applicationIds);
        return _mapper.Map<List<RecentActivityDto>>(activities);
    }

    // A response's ChildId identifies the single child it's about; for a combined view
    // over several children there's no single owner, so it's left empty.
    private static Guid SingleChildOrEmpty(IReadOnlyCollection<Guid> childIds)
        => childIds.Count == 1 ? childIds.First() : Guid.Empty;

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
    // Returned as a type + params rather than a formatted sentence: the backend has
    // no notion of the caller's locale, so the frontend renders the actual text via
    // its own i18n, the same way every other piece of UI copy is localized.
    private async Task<List<RecommendationDto>> BuildRecommendationsAsync(
        IReadOnlyList<AppUsageAggregate> perApp,
        IReadOnlyList<ActivityRecord> recent)
    {
        var recommendations = new List<RecommendationDto>();

        if (perApp.Count == 0)
        {
            recommendations.Add(new RecommendationDto { Type = "no_usage" });
            return recommendations;
        }

        var leastUsed = perApp.OrderBy(a => a.TotalSeconds).First();
        var leastUsedName = await _appRegistryClient.GetApplicationNameAsync(leastUsed.ApplicationId);
        // Skip the recommendation rather than fall back to a raw app id — a GUID in
        // the message is confusing regardless of locale.
        if (leastUsedName is not null)
            recommendations.Add(new RecommendationDto
            {
                Type = "least_used_app",
                Params = { ["appName"] = leastUsedName }
            });

        var weakest = recent
            .Where(a => a.Score.HasValue)
            .GroupBy(a => a.ActivityType)
            .Select(g => new { Type = g.Key, Avg = g.Average(a => a.Score!.Value) })
            .OrderBy(x => x.Avg)
            .FirstOrDefault();

        if (weakest is not null)
            recommendations.Add(new RecommendationDto
            {
                Type = "weak_activity_type",
                Params = { ["activityType"] = weakest.Type, ["avgScore"] = weakest.Avg.ToString("0.0") }
            });

        return recommendations;
    }
}
