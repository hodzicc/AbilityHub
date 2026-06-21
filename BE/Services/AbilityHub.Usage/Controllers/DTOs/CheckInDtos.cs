namespace AbilityHub.Usage.Controllers.DTOs;

/// <summary>
/// A weekly parent evaluation submitted from the web app. <see cref="WeekStartDate"/>
/// (Monday of the week) plus the child is the natural key — re-submitting the same
/// week updates the existing entry. Enum-like values mirror the frontend unions;
/// the backend keeps them as free strings so new options don't require a migration.
/// </summary>
public class WeeklyCheckInRequest
{
    public DateOnly WeekStartDate { get; set; }

    public string? MoodBefore { get; set; }
    public string? MoodAfter { get; set; }
    public string? HelpLevel { get; set; }
    public string? PerformanceQuality { get; set; }

    public bool SafetyIncident { get; set; }
    public string? SafetyIncidentNotes { get; set; }

    public string? DayContext { get; set; }
    public string? DayContextNotes { get; set; }

    public bool? UsesSkillOutsideApp { get; set; }
    public string? GeneralNotes { get; set; }
}

public class WeeklyCheckInResponse
{
    public string Id { get; set; } = string.Empty;
    public Guid ChildId { get; set; }
    public DateOnly WeekStartDate { get; set; }

    public string? MoodBefore { get; set; }
    public string? MoodAfter { get; set; }
    public string? HelpLevel { get; set; }
    public string? PerformanceQuality { get; set; }

    public bool SafetyIncident { get; set; }
    public string? SafetyIncidentNotes { get; set; }

    public string? DayContext { get; set; }
    public string? DayContextNotes { get; set; }

    public bool? UsesSkillOutsideApp { get; set; }
    public string? GeneralNotes { get; set; }

    public DateTime CreatedAt { get; set; }
}
