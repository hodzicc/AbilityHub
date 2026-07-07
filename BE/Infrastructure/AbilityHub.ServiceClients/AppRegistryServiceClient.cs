using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;

namespace AbilityHub.ServiceClients;

public class AppRegistryServiceClient(HttpClient httpClient, ILogger<AppRegistryServiceClient> logger)
    : IAppRegistryServiceClient
{
    private readonly HttpClient _httpClient = httpClient;
    private readonly ILogger<AppRegistryServiceClient> _logger = logger;

    // Subset of AppRegistry's ChildApplicationResponse — only the key is needed.
    private sealed record AssignedApp(string Key);

    // Subset of AppRegistry's ApplicationResponse — only the name is needed.
    private sealed record ApplicationInfo(string Name);

    public async Task<string?> GetApplicationNameAsync(Guid applicationId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/apps/{applicationId}");
            if (!response.IsSuccessStatusCode)
                return null;

            var app = await response.Content.ReadFromJsonAsync<ApplicationInfo>();
            return app?.Name;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Application lookup against AppRegistry failed for {ApplicationId}.", applicationId);
            return null;
        }
    }

    public async Task<IReadOnlyList<string>> GetAssignedAppKeysAsync(Guid childId, string accessToken)
    {
        try
        {
            // Reuses the existing "apps assigned to a child" endpoint, called as the child
            // (their own token) — no shared service secret involved.
            using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/apps/children/{childId}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
                return [];

            var apps = await response.Content.ReadFromJsonAsync<List<AssignedApp>>() ?? [];
            return apps.Select(a => a.Key).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Assignment lookup against AppRegistry failed for {ChildId}.", childId);
            return [];
        }
    }
}
