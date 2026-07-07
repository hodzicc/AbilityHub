using AbilityHub.ServiceClients;
using AbilityHub.Usage;
using AbilityHub.Usage.Controllers.DTOs;
using AbilityHub.Usage.Mapping;
using AbilityHub.Usage.Repositories;
using AbilityHub.Usage.Services;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace AbilityHub.Tests;

/// <summary>
/// Verifies the core promise of the platform: when a (mobile) app reports usage and
/// an activity with accessibility metrics, the parent's dashboard reflects it —
/// totals, step-level progress, per-day usage, the heatmap days, and the per-metric
/// detail — and that the app-id filter scopes everything correctly.
/// </summary>
public class UsageStatisticsTests
{
    private static UsageService BuildService(out UsageDbContext db)
    {
        var options = new DbContextOptionsBuilder<UsageDbContext>()
            .UseInMemoryDatabase($"usage-{Guid.NewGuid()}")
            .Options;
        db = new UsageDbContext(options);

        var mapper = new MapperConfiguration(
            cfg => cfg.AddProfile<UsageMappingProfile>(), NullLoggerFactory.Instance).CreateMapper();
        var repo = new UsageRepository(db, NullLogger<UsageRepository>.Instance, mapper);
        var settingsClient = new Mock<ISettingsServiceClient>().Object; // not exercised by the dashboard
        var appRegistryClient = new Mock<IAppRegistryServiceClient>().Object; // not exercised by the dashboard
        return new UsageService(repo, settingsClient, appRegistryClient, mapper);
    }

    private static UsageReportRequest CompletedTaskReport(Guid appId)
    {
        var now = DateTime.UtcNow;
        return new UsageReportRequest
        {
            ApplicationId = appId,
            Session = new SessionDto { StartedAt = now.AddMinutes(-2), EndedAt = now },
            Activities =
            {
                new ActivityDto
                {
                    ActivityType = "hygiene",
                    Name = "Operi ruke",
                    OccurredAt = now,
                    InProgress = false,
                    Metrics = new ActivityMetricsDto
                    {
                        StartedViaAction = true,
                        CompletedViaAction = true,
                        StepsCompleted = 6,
                        StepsTotal = 6,
                        DurationSeconds = 90,
                        HintsShown = 1,
                        ErrorsCount = 0,
                    },
                },
            },
        };
    }

    [Fact]
    public async Task Reported_activity_surfaces_on_the_dashboard_with_its_metrics()
    {
        var childId = Guid.NewGuid();
        var appId = Guid.NewGuid();
        var service = BuildService(out _);

        await service.ReportAsync(childId, CompletedTaskReport(appId));

        var dash = await service.GetDashboardAsync(childId);

        Assert.Equal(1, dash.ActivityCount);
        Assert.True(dash.TotalUsageMinutes >= 1, "a ~2 min session should round to at least 1 minute");

        // Per-app aggregate present for the reporting app.
        var perApp = Assert.Single(dash.PerApp);
        Assert.Equal(appId, perApp.ApplicationId);
        Assert.True(perApp.TotalMinutes >= 1);

        // Step-level progress: 6 of 6 sub-steps = 100%.
        Assert.Equal(100, dash.AvgProgressPercent);

        // The activity carries its full per-metric detail through to the dashboard.
        var activity = Assert.Single(dash.RecentActivities);
        Assert.NotNull(activity.Metrics);
        Assert.True(activity.Metrics!.StartedViaAction);
        Assert.True(activity.Metrics.CompletedViaAction);
        Assert.Equal(6, activity.Metrics.StepsCompleted);
        Assert.Equal(6, activity.Metrics.StepsTotal);
        Assert.Equal(1, activity.Metrics.HintsShown);

        // Today shows up in the heatmap days and the weekly per-day usage.
        Assert.Contains(dash.ActiveDays, d => d.Date == DateTime.UtcNow.Date);
        Assert.Equal(7, dash.DailyUsage.Count);
        Assert.True(dash.DailyUsage[^1].Minutes >= 1, "today's bar should reflect the session");
    }

    [Fact]
    public async Task Dashboard_is_empty_before_any_usage_is_reported()
    {
        var service = BuildService(out _);

        var dash = await service.GetDashboardAsync(Guid.NewGuid());

        Assert.Equal(0, dash.ActivityCount);
        Assert.Empty(dash.PerApp);
        Assert.Null(dash.AvgProgressPercent);
        Assert.Empty(dash.ActiveDays);
        Assert.All(dash.DailyUsage, d => Assert.Equal(0, d.Minutes));
    }

    [Fact]
    public async Task Filtering_by_application_ids_scopes_every_figure()
    {
        var childId = Guid.NewGuid();
        var appId = Guid.NewGuid();
        var otherAppId = Guid.NewGuid();
        var service = BuildService(out _);

        await service.ReportAsync(childId, CompletedTaskReport(appId));

        // Filtering to the reporting app keeps the data.
        var matching = await service.GetDashboardAsync(childId, new[] { appId });
        Assert.Equal(1, matching.ActivityCount);
        Assert.Single(matching.PerApp);

        // Filtering to an unrelated app yields nothing — not "everything".
        var nonMatching = await service.GetDashboardAsync(childId, new[] { otherAppId });
        Assert.Equal(0, nonMatching.ActivityCount);
        Assert.Empty(nonMatching.PerApp);
        Assert.Null(nonMatching.AvgProgressPercent);
        Assert.Empty(nonMatching.ActiveDays);
    }

    [Fact]
    public async Task Live_progress_updates_the_same_activity_row_instead_of_duplicating()
    {
        var childId = Guid.NewGuid();
        var appId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var service = BuildService(out _);

        // Same activity id reported twice as the child advances: step 2, then step 4.
        async Task ReportStep(int stepsCompleted, bool done)
        {
            await service.ReportAsync(childId, new UsageReportRequest
            {
                ApplicationId = appId,
                Activities =
                {
                    new ActivityDto
                    {
                        Id = activityId,
                        ActivityType = "hygiene",
                        Name = "Operi ruke",
                        OccurredAt = DateTime.UtcNow,
                        InProgress = !done,
                        Metrics = new ActivityMetricsDto { StepsCompleted = stepsCompleted, StepsTotal = 6 },
                    },
                },
            });
        }

        await ReportStep(2, done: false);
        await ReportStep(4, done: true);

        var dash = await service.GetDashboardAsync(childId);
        var activity = Assert.Single(dash.RecentActivities); // one row, updated in place
        Assert.Equal(4, activity.Metrics!.StepsCompleted);
        Assert.False(activity.InProgress);
    }
}
