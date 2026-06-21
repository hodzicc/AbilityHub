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

    public string ActivityType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public double? Score { get; set; }
    public DateTime OccurredAt { get; set; }
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
    public List<string> Recommendations { get; set; } = new();
}

/// <summary>An activity as surfaced on the dashboard, carrying its id, owning app and metrics.</summary>
public class RecentActivityDto
{
    public Guid Id { get; set; }
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
