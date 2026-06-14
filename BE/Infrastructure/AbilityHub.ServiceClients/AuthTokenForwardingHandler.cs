using Microsoft.AspNetCore.Http;

namespace AbilityHub.ServiceClients;

/// <summary>
/// Forwards the incoming request's bearer token onto outbound service-to-service
/// calls, so the downstream service authorizes them as the original caller.
/// </summary>
public class AuthTokenForwardingHandler(IHttpContextAccessor httpContextAccessor) : DelegatingHandler
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var authorization = _httpContextAccessor.HttpContext?.Request.Headers.Authorization.ToString();

        if (!string.IsNullOrWhiteSpace(authorization))
            request.Headers.TryAddWithoutValidation("Authorization", authorization);

        return base.SendAsync(request, cancellationToken);
    }
}
