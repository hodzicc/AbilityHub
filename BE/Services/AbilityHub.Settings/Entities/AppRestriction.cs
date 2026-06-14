using System.ComponentModel.DataAnnotations.Schema;

namespace AbilityHub.Settings.Entities;

/// <summary>
/// Parent-set usage limits for one (child, app) pairing: an optional daily time
/// limit and a hard block switch. Keyed by (ChildId, ApplicationId).
/// </summary>
[Table("AppRestrictions")]
public class AppRestriction
{
    public Guid ChildId { get; set; }
    public Guid ApplicationId { get; set; }

    /// <summary>Minutes per day the child may use the app; null = no limit.</summary>
    public int? DailyTimeLimitMinutes { get; set; }

    /// <summary>If true the app is fully blocked for the child.</summary>
    public bool IsBlocked { get; set; }

    public Guid? UpdatedByGuardianId { get; set; }
    public DateTime UpdatedAt { get; set; }
}
