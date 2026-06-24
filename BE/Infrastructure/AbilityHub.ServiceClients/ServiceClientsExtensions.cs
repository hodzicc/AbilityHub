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
    /// Registers a typed client to the AppRegistry service for assignment lookups.
    /// The caller passes the access token to use per request (e.g. Auth at login uses
    /// the child's own freshly-minted token), so no token-forwarding handler is wired.
    /// Base address comes from <c>Services:AppRegistryBaseUrl</c>.
    /// </summary>
    public static IServiceCollection AddAppRegistryServiceClient(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpClient<IAppRegistryServiceClient, AppRegistryServiceClient>(client =>
            client.BaseAddress = new Uri(configuration["Services:AppRegistryBaseUrl"]
                ?? throw new InvalidOperationException("Services:AppRegistryBaseUrl is not configured.")));

        return services;
    }
}
