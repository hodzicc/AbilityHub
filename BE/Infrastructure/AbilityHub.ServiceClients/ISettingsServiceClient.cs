namespace AbilityHub.ServiceClients;

/// <summary>Restriction snapshot fetched from the Settings service.</summary>
public record RestrictionInfo(int? DailyTimeLimitMinutes, bool IsBlocked);

/// <summary>
/// Reads a child's resolved restriction for an app from the Settings service so
/// Usage can compare accumulated usage against the configured limits.
/// </summary>
public interface ISettingsServiceClient
{
    Task<RestrictionInfo?> GetRestrictionAsync(Guid childId, Guid applicationId);
}
