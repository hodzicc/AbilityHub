namespace AbilityHub.Settings.Controllers.DTOs;

public class SetPreferencesRequest
{
    public Dictionary<string, string> Preferences { get; set; } = new();
}

public class PreferencesResponse
{
    public Dictionary<string, string> Preferences { get; set; } = new();
}

public class RestrictionRequest
{
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
