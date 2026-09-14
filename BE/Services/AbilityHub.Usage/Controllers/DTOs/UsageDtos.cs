using System.ComponentModel.DataAnnotations;

namespace AbilityHub.Usage.Controllers.DTOs;

// ---- Ingestion (the standardized "abilityhub.usage.v1" report; see docs/usage-format.md) ----

public class UsageReportRequest
{
    public Guid ApplicationId { get; set; }
    public SessionDto? Session { get; set; }
    public List<ActivityDto> Activities { get; set; } = new();
}

public class SessionDto
{
    /// <summary>
    /// Optional client-generated id for one continuous foreground period. When the
    /// app sends the same id repeatedly (a heartbeat), the server updates that one
    /// session row instead of inserting many — so total time grows live (and the
    /// daily limit can be enforced mid-session) without inflating the session count.
    /// Omit it for a one-shot session report.
    /// </summary>
    public Guid? Id { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime EndedAt { get; set; }
}

public class ActivityDto
{
    /// <summary>
    /// Optional client-generated id for one activity attempt. Sending the same id as
    /// the child advances (start → step 1 → step 2 → … → done) updates that one row
    /// in place, so the dashboard shows the current step live without piling up a
    /// record per step. Omit it for a one-shot completed-activity report.
    /// </summary>
    public Guid? Id { get; set; }

    [StringLength(100)]
    public string ActivityType { get; set; } = string.Empty;
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;
    public double? Score { get; set; }
    public DateTime OccurredAt { get; set; }
    [StringLength(1000)]
    public string? Detail { get; set; }

    /// <summary>True for a live progress update (child still working); false/omitted when finished.</summary>
    public bool InProgress { get; set; }

    /// <summary>
    /// Generic key/value bag for app-specific data the platform doesn't model
    /// (e.g. <c>{"level":"3","difficulty":"hard"}</c>). Any keys, no schema change.
    /// </summary>
    public Dictionary<string, string>? Attributes { get; set; }

    /// <summary>Optional accessibility metrics; apps omit any field they can't report.</summary>
    public ActivityMetricsDto? Metrics { get; set; }
}

/// <summary>
/// Per-activity accessibility metrics (see docs/usage-format.md). Every field is
/// nullable so an app reports only what it can; the dashboard shows "not available"
/// for the rest. New signals can be added here without breaking existing apps.
/// </summary>
public class ActivityMetricsDto
{
    public bool? StartedViaAction { get; set; }
    public bool? CompletedViaAction { get; set; }
    public int? StepsCompleted { get; set; }
    public int? StepsTotal { get; set; }
    public int? DurationSeconds { get; set; }
    public int? HintsShown { get; set; }
    public int? ErrorsCount { get; set; }
}

// ---- Dashboard ----

public class DashboardResponse
{
    public Guid ChildId { get; set; }
    public DateTime GeneratedAt { get; set; }

    /// <summary>Inclusive first/last UTC day of the usage window this dashboard covers
    /// (per-app totals, daily usage, total minutes). Lets the frontend label the range
    /// and bound its week navigation.</summary>
    public DateTime RangeStart { get; set; }
    public DateTime RangeEnd { get; set; }

    public long TotalUsageMinutes { get; set; }
    public int ActivityCount { get; set; }

    /// <summary>
    /// Average step-completion across activities that reported steps, as a 0–100
    /// percentage. Null when no activity reported step counts — the frontend then
    /// falls back to its rough "apps used" proxy. Replaces guessing progress from time.
    /// </summary>
    public double? AvgProgressPercent { get; set; }

    /// <summary>
    /// Fraction (0–1) of the last 7 days on which the child completed any activity —
    /// a routine-consistency signal. Null when there is no recent activity.
    /// </summary>
    public double? WeeklyConsistency { get; set; }

    public List<AppUsageDto> PerApp { get; set; } = new();
    public List<RecentActivityDto> RecentActivities { get; set; } = new();
    public List<RecommendationDto> Recommendations { get; set; } = new();

    /// <summary>
    /// Distinct UTC dates in the last 90 days on which the child completed any
    /// activity — backs the frontend's activity heatmap calendar.
    /// </summary>
    public List<DateTime> ActiveDays { get; set; } = new();

    /// <summary>
    /// Usage minutes per day for the last 7 days (oldest → newest, every day present,
    /// gaps filled with 0) — backs the dashboard's weekly bar chart.
    /// </summary>
    public List<DailyUsageDto> DailyUsage { get; set; } = new();
}

/// <summary>
/// A recommendation as a translation key + parameters instead of a pre-formatted
/// sentence — the backend doesn't know the caller's locale, so it hands the frontend
/// what it needs to render the message in whichever language is active, the same way
/// every other piece of UI text is localized.
/// </summary>
public class RecommendationDto
{
    /// <summary>One of "no_usage", "least_used_app", "weak_activity_type" — maps to an i18n key.</summary>
    public string Type { get; set; } = string.Empty;
    public Dictionary<string, string> Params { get; set; } = new();
}

/// <summary>Which days in a given calendar month have any recorded activity — backs
/// the statistics calendar's month grid (highlighting days, not counts).</summary>
public class CalendarMonthResponse
{
    public Guid ChildId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public List<DateTime> ActiveDays { get; set; } = new();
}

/// <summary>Usage minutes on a single UTC calendar day.</summary>
public class DailyUsageDto
{
    public DateTime Date { get; set; }
    public long Minutes { get; set; }
}

/// <summary>Per-day activity outcome metrics over a window — backs the statistics
/// "activity outcomes" chart (hints, completed, not-completed, step-backs per day).</summary>
public class DailyMetricsResponse
{
    public Guid ChildId { get; set; }
    public DateTime RangeStart { get; set; }
    public DateTime RangeEnd { get; set; }
    public List<DailyMetricsDayDto> Days { get; set; } = new();
}

public class DailyMetricsDayDto
{
    public DateTime Date { get; set; }
    public int Hints { get; set; }
    public int Completed { get; set; }
    public int NotCompleted { get; set; }
    /// <summary>Wrong selections, skipped steps, or returns to a previous step — surfaced
    /// to parents as "step-backs" rather than "errors".</summary>
    public int StepBacks { get; set; }
}

/// <summary>An activity as surfaced on the dashboard, carrying its id, owning app and metrics.</summary>
public class RecentActivityDto
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public Guid ApplicationId { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public double? Score { get; set; }
    public DateTime OccurredAt { get; set; }
    public string? Detail { get; set; }

    /// <summary>True while the child is mid-activity — the dashboard shows the current step live.</summary>
    public bool InProgress { get; set; }

    /// <summary>App-specific key/values the app reported (e.g. level, difficulty).</summary>
    public Dictionary<string, string>? Attributes { get; set; }

    public ActivityMetricsDto? Metrics { get; set; }
}

public class AppUsageDto
{
    public Guid ApplicationId { get; set; }
    public int SessionCount { get; set; }
    public long TotalMinutes { get; set; }
    public DateTime LastUsedAt { get; set; }
}

/// <summary>
/// Usage snapshot aggregated over a set of children in one backend pass, rather than
/// the client fetching each child's individual dashboard and summing them. The same
/// shape serves an admin (every child on the platform) and a parent (their own
/// children) — the scope is decided by the caller's role, not by a different endpoint.
/// </summary>
public class AggregateDashboardResponse
{
    public DateTime GeneratedAt { get; set; }

    /// <summary>Distinct children (within the caller's scope) with any recorded activity in the last 7 days.</summary>
    public int ActiveChildrenCount { get; set; }

    public long TotalUsageMinutesToday { get; set; }

    /// <summary>Average step-completion percentage across every child that reported
    /// step counts. Null when no activity anywhere reported step counts.</summary>
    public double? AvgProgressPercent { get; set; }

    /// <summary>Usage minutes per day for the last 7 days, summed across all children
    /// (oldest → newest, every day present, gaps filled with 0).</summary>
    public List<DailyUsageDto> DailyUsage { get; set; } = new();

    public List<RecentActivityDto> RecentActivities { get; set; } = new();
}

/// <summary>A child's average step-completion progress (0–100). Only children with at
/// least one step-reporting activity are returned; the client defaults the rest to 0.</summary>
public class ChildProgressDto
{
    public Guid ChildId { get; set; }
    public double AvgProgressPercent { get; set; }
}

// ---- Limit status ----

public class LimitStatusResponse
{
    public Guid ChildId { get; set; }
    public Guid ApplicationId { get; set; }
    public bool IsBlocked { get; set; }
    public int? DailyLimitMinutes { get; set; }
    public int UsedTodayMinutes { get; set; }
    public int? RemainingMinutes { get; set; }
    public bool LimitReached { get; set; }
}
