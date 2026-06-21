using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace AbilityHub.Usage.Entities;

/// <summary>
/// A discrete activity a child completed in an app (e.g. a finished game level or
/// lesson), optionally with a score. <see cref="Detail"/> is free-form so apps can
/// attach extra structured data without changing the schema.
/// </summary>
[Table("ActivityRecords")]
public class ActivityRecord
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public Guid ApplicationId { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public double? Score { get; set; }
    public DateTime OccurredAt { get; set; }
    public string? Detail { get; set; }

    /// <summary>
    /// True while the child is still working through the activity (live step
    /// progress); set false once it's finished — whether completed or abandoned.
    /// Lets the dashboard show "currently on step X" vs. a final result.
    /// </summary>
    public bool InProgress { get; set; }

    // ---- Accessibility-focused metrics (all optional) ----
    // Apps that can't report a given signal simply leave it null, and the
    // dashboard renders "Nije dostupno" for it. See docs/usage-format.md and
    // BE/API_CONTRACTS_NEEDED.md. "Time spent" alone is a poor proxy for whether
    // an activity helped, so these capture how the activity was actually done.

    /// <summary>Activity was begun via an explicit action (Start button, opening a task…).</summary>
    public bool? StartedViaAction { get; set; }

    /// <summary>Activity was finished via an explicit action (Done button, confirming the last step…).</summary>
    public bool? CompletedViaAction { get; set; }

    /// <summary>Sub-steps completed out of <see cref="StepsTotal"/> (task/subtask granularity).</summary>
    public int? StepsCompleted { get; set; }
    public int? StepsTotal { get; set; }

    /// <summary>Time from start to completion of this activity.</summary>
    public int? DurationSeconds { get; set; }

    /// <summary>How many times a hint / image / voice prompt or similar support was shown.</summary>
    public int? HintsShown { get; set; }

    /// <summary>Errors from wrong selections, skipped steps, or returning to a previous step.</summary>
    public int? ErrorsCount { get; set; }

    /// <summary>
    /// Generic, open key/value bag for app-specific data the platform doesn't model
    /// explicitly — e.g. <c>level</c>, <c>difficulty</c>, <c>world</c>. Stored opaquely as
    /// JSON so any app can add any keys without a schema change. This is the
    /// extensibility point integrating apps use for their own concepts.
    /// </summary>
    public string? AttributesJson { get; set; }

    [NotMapped]
    public Dictionary<string, string>? Attributes
    {
        get => string.IsNullOrEmpty(AttributesJson)
            ? null
            : JsonSerializer.Deserialize<Dictionary<string, string>>(AttributesJson);
        set => AttributesJson = (value == null || value.Count == 0)
            ? null
            : JsonSerializer.Serialize(value);
    }
}
