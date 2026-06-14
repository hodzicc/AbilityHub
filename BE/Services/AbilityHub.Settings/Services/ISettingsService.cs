using AbilityHub.Settings.Controllers.DTOs;

namespace AbilityHub.Settings.Services;

public interface ISettingsService
{
    Task<Dictionary<string, string>> GetPreferencesAsync(Guid childId, Guid? applicationId);
    Task SetPreferencesAsync(Guid childId, Guid? applicationId, IReadOnlyDictionary<string, string> values);

    Task<RestrictionResponse> GetRestrictionAsync(Guid childId, Guid applicationId);
    Task SetRestrictionAsync(Guid childId, Guid applicationId, RestrictionRequest request, Guid updatedByGuardianId);

    /// <summary>Merged global + per-app preferences plus the restriction — what an app applies at login.</summary>
    Task<ResolvedSettingsResponse> ResolveAsync(Guid childId, Guid applicationId);
}
