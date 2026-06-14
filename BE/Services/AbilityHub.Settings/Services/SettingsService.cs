using MassTransit;
using AbilityHub.Settings.Controllers.DTOs;
using AbilityHub.Settings.Entities;
using AbilityHub.Settings.Repositories;
using AbilityHub.Shared.Events;

namespace AbilityHub.Settings.Services;

public class SettingsService(
    IPreferenceRepository preferences,
    IRestrictionRepository restrictions,
    IPublishEndpoint publishEndpoint) : ISettingsService
{
    private readonly IPreferenceRepository _preferences = preferences;
    private readonly IRestrictionRepository _restrictions = restrictions;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public async Task<Dictionary<string, string>> GetPreferencesAsync(Guid childId, Guid? applicationId)
    {
        var prefs = await _preferences.GetAsync(childId, applicationId);
        return prefs.ToDictionary(p => p.Key, p => p.Value);
    }

    public async Task SetPreferencesAsync(Guid childId, Guid? applicationId, IReadOnlyDictionary<string, string> values)
    {
        await _preferences.UpsertManyAsync(childId, applicationId, values);
        await _publishEndpoint.Publish(new PreferencesUpdated(childId, applicationId));
    }

    public async Task<RestrictionResponse> GetRestrictionAsync(Guid childId, Guid applicationId)
    {
        var restriction = await _restrictions.GetAsync(childId, applicationId);
        return new RestrictionResponse
        {
            DailyTimeLimitMinutes = restriction?.DailyTimeLimitMinutes,
            IsBlocked = restriction?.IsBlocked ?? false
        };
    }

    public async Task SetRestrictionAsync(Guid childId, Guid applicationId, RestrictionRequest request, Guid updatedByGuardianId)
    {
        await _restrictions.UpsertAsync(new AppRestriction
        {
            ChildId = childId,
            ApplicationId = applicationId,
            DailyTimeLimitMinutes = request.DailyTimeLimitMinutes,
            IsBlocked = request.IsBlocked,
            UpdatedByGuardianId = updatedByGuardianId,
            UpdatedAt = DateTime.UtcNow
        });

        await _publishEndpoint.Publish(new PreferencesUpdated(childId, applicationId));
    }

    public async Task<ResolvedSettingsResponse> ResolveAsync(Guid childId, Guid applicationId)
    {
        // Per-app values override the child's global defaults.
        var merged = new Dictionary<string, string>();

        foreach (var p in await _preferences.GetAsync(childId, applicationId: null))
            merged[p.Key] = p.Value;

        foreach (var p in await _preferences.GetAsync(childId, applicationId))
            merged[p.Key] = p.Value;

        return new ResolvedSettingsResponse
        {
            ChildId = childId,
            ApplicationId = applicationId,
            Preferences = merged,
            Restriction = await GetRestrictionAsync(childId, applicationId)
        };
    }
}
