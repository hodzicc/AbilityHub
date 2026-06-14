using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;

namespace AbilityHub.ServiceClients;

public class UsersServiceClient(HttpClient httpClient, ILogger<UsersServiceClient> logger) : IUsersServiceClient
{
    private readonly HttpClient _httpClient = httpClient;
    private readonly ILogger<UsersServiceClient> _logger = logger;

    private sealed record UserRef(Guid Id);

    public async Task<bool> IsGuardianOfChildAsync(Guid guardianId, Guid childId)
    {
        try
        {
            // The caller's bearer token is forwarded by AuthTokenForwardingHandler,
            // so Users authorizes this as the guardian asking about their own children.
            var response = await _httpClient.GetAsync($"/api/users/{guardianId}/children");

            if (response.StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.Unauthorized)
                return false;

            response.EnsureSuccessStatusCode();

            var children = await response.Content.ReadFromJsonAsync<List<UserRef>>() ?? [];
            return children.Any(c => c.Id == childId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Guardian check against Users service failed for {GuardianId}/{ChildId}.", guardianId, childId);
            return false;
        }
    }
}
