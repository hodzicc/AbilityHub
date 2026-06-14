using System.Net.Http.Json;
using Microsoft.Extensions.Logging;

namespace AbilityHub.ServiceClients;

public class SettingsServiceClient(HttpClient httpClient, ILogger<SettingsServiceClient> logger) : ISettingsServiceClient
{
    private readonly HttpClient _httpClient = httpClient;
    private readonly ILogger<SettingsServiceClient> _logger = logger;

    // Mirrors the shape of Settings' ResolvedSettingsResponse (only what we need).
    private sealed record Resolved(RestrictionDto? Restriction);
    private sealed record RestrictionDto(int? DailyTimeLimitMinutes, bool IsBlocked);

    public async Task<RestrictionInfo?> GetRestrictionAsync(Guid childId, Guid applicationId)
    {
        try
        {
            // The resolved endpoint is readable by the child, a guardian, or an admin —
            // matching the audience that asks for limit status.
            var response = await _httpClient.GetAsync(
                $"/api/settings/children/{childId}/apps/{applicationId}/resolved");

            if (!response.IsSuccessStatusCode)
                return null;

            var resolved = await response.Content.ReadFromJsonAsync<Resolved>();
            return resolved?.Restriction is { } r
                ? new RestrictionInfo(r.DailyTimeLimitMinutes, r.IsBlocked)
                : new RestrictionInfo(null, false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Restriction lookup against Settings failed for {ChildId}/{AppId}.", childId, applicationId);
            return null;
        }
    }
}
