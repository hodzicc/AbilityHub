using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AbilityHub.ServiceClients;

public static class ServiceClientsExtensions
{
    /// <summary>
    /// Registers a typed client to the Users service that forwards the caller's
    /// bearer token. Base address comes from <c>Services:UsersBaseUrl</c>.
    /// </summary>
    public static IServiceCollection AddUsersServiceClient(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddTransient<AuthTokenForwardingHandler>();

        services.AddHttpClient<IUsersServiceClient, UsersServiceClient>(client =>
                client.BaseAddress = new Uri(configuration["Services:UsersBaseUrl"]
                    ?? throw new InvalidOperationException("Services:UsersBaseUrl is not configured.")))
            .AddHttpMessageHandler<AuthTokenForwardingHandler>();

        return services;
    }

    /// <summary>
    /// Registers a typed client to the Settings service that forwards the caller's
    /// bearer token. Base address comes from <c>Services:SettingsBaseUrl</c>.
    /// </summary>
    public static IServiceCollection AddSettingsServiceClient(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddTransient<AuthTokenForwardingHandler>();

        services.AddHttpClient<ISettingsServiceClient, SettingsServiceClient>(client =>
                client.BaseAddress = new Uri(configuration["Services:SettingsBaseUrl"]
                    ?? throw new InvalidOperationException("Services:SettingsBaseUrl is not configured.")))
            .AddHttpMessageHandler<AuthTokenForwardingHandler>();

        return services;
    }

    /// <summary>
    /// Registers a typed client to the AppRegistry service. Requests forward the
    /// current caller's bearer token automatically; callers that need to act on behalf
    /// of someone else (e.g. Auth at login, using the child's freshly-minted token) can
    /// still set an explicit Authorization header per-request, which takes precedence.
    /// Base address comes from <c>Services:AppRegistryBaseUrl</c>.
    /// </summary>
    public static IServiceCollection AddAppRegistryServiceClient(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddTransient<AuthTokenForwardingHandler>();

        services.AddHttpClient<IAppRegistryServiceClient, AppRegistryServiceClient>(client =>
                client.BaseAddress = new Uri(configuration["Services:AppRegistryBaseUrl"]
                    ?? throw new InvalidOperationException("Services:AppRegistryBaseUrl is not configured.")))
            .AddHttpMessageHandler<AuthTokenForwardingHandler>();

        return services;
    }
}
