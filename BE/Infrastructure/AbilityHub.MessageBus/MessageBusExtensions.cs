using System.Reflection;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AbilityHub.MessageBus;

/// <summary>
/// Centralizes RabbitMQ / MassTransit wiring so every service connects to the
/// broker the same way. Services only declare their consumers.
/// </summary>
public static class MessageBusExtensions
{
    /// <param name="configureConsumers">
    /// Optional hook to register consumers, e.g. <c>x =&gt; x.AddConsumer&lt;FooConsumer&gt;()</c>.
    /// Publish-only services (no consumers) can omit it.
    /// </param>
    public static IServiceCollection AddAbilityHubMessageBus(
        this IServiceCollection services,
        IConfiguration configuration,
        Action<IBusRegistrationConfigurator>? configureConsumers = null)
    {
        services.AddMassTransit(x =>
        {
            // Namespace the queue names per service so consumers don't collide.
            x.SetKebabCaseEndpointNameFormatter();

            configureConsumers?.Invoke(x);

            x.UsingRabbitMq((context, cfg) =>
            {
                cfg.Host(configuration["RabbitMQ:Host"] ?? "localhost", h =>
                {
                    h.Username(configuration["RabbitMQ:Username"] ?? "guest");
                    h.Password(configuration["RabbitMQ:Password"] ?? "guest");
                });

                cfg.ConfigureEndpoints(context);
            });
        });

        return services;
    }
}
