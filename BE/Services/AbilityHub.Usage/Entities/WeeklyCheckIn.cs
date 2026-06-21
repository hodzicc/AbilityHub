using System.ComponentModel.DataAnnotations.Schema;

namespace AbilityHub.Usage.Entities;

/// <summary>
/// A short weekly evaluation a parent fills in for a child. It captures the
/// subjective, real-world context that in-app metrics can't — mood, how much
/// help was needed, real-world performance quality, safety incidents, daily
/// context (sleep/illness/…), and whether the skill generalizes outside the app.
/// One row per child per ISO week (Monday).
/// Enum-like fields are stored as strings so the set of allowed values can grow
/// without a schema change (values mirror the frontend unions).
/// </summary>
[Table("WeeklyCheckIns")]
public class WeeklyCheckIn
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }

    /// <summary>Monday of the evaluated week.</summary>
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
    public DateTime UpdatedAt { get; set; }
}
