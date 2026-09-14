using System.ComponentModel.DataAnnotations;

namespace AbilityHub.Settings.Controllers.DTOs;

public class SetPreferencesRequest
{
    // Keys/values are further checked against UIPreferenceCatalog in the controller.
    [Required]
    public Dictionary<string, string> Preferences { get; set; } = new();
}

public class PreferencesResponse
{
    public Dictionary<string, string> Preferences { get; set; } = new();
}

public class RestrictionRequest
{
    // A daily allowance, in minutes: 0..1440 (a full day). Null = no time limit.
    [Range(0, 1440)]
    public int? DailyTimeLimitMinutes { get; set; }

    public bool IsBlocked { get; set; }
}

public class RestrictionResponse
{
    public int? DailyTimeLimitMinutes { get; set; }
    public bool IsBlocked { get; set; }
}

/// <summary>What an app should apply for a child: merged preferences + the restriction.</summary>
public class ResolvedSettingsResponse
{
    public Guid ChildId { get; set; }
    public Guid ApplicationId { get; set; }
    public Dictionary<string, string> Preferences { get; set; } = new();
    public RestrictionResponse Restriction { get; set; } = new();
}
