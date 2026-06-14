using System.ComponentModel.DataAnnotations.Schema;

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
}
