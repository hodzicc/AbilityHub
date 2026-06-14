using System.ComponentModel.DataAnnotations.Schema;

namespace AbilityHub.Usage.Entities;

/// <summary>
/// A period a child spent in an app, reported by the app in the standardized
/// usage format (see docs/usage-format.md).
/// </summary>
[Table("UsageSessions")]
public class UsageSession
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public Guid ApplicationId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime EndedAt { get; set; }
    public int DurationSeconds { get; set; }
    public DateTime ReportedAt { get; set; }
}
