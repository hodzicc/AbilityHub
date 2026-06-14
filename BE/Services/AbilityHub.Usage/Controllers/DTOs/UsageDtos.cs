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
    public DateTime StartedAt { get; set; }
    public DateTime EndedAt { get; set; }
}

public class ActivityDto
{
    public string ActivityType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public double? Score { get; set; }
    public DateTime OccurredAt { get; set; }
    public string? Detail { get; set; }
}

// ---- Dashboard ----

public class DashboardResponse
{
    public Guid ChildId { get; set; }
    public DateTime GeneratedAt { get; set; }
    public long TotalUsageMinutes { get; set; }
    public int ActivityCount { get; set; }
    public List<AppUsageDto> PerApp { get; set; } = new();
    public List<ActivityDto> RecentActivities { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
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
