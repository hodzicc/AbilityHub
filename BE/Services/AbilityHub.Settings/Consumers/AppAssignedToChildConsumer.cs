using MassTransit;
using AbilityHub.Settings.Repositories;
using AbilityHub.Shared.Events;

namespace AbilityHub.Settings.Consumers;

/// <summary>
/// When AppRegistry assigns an app to a child, seed a default (unrestricted)
/// restriction row so the parent has something to configure. Idempotent.
/// </summary>
public class AppAssignedToChildConsumer(IRestrictionRepository restrictions, ILogger<AppAssignedToChildConsumer> logger)
    : IConsumer<AppAssignedToChild>
{
    private readonly IRestrictionRepository _restrictions = restrictions;
    private readonly ILogger<AppAssignedToChildConsumer> _logger = logger;

    public async Task Consume(ConsumeContext<AppAssignedToChild> context)
    {
        var msg = context.Message;
        await _restrictions.EnsureExistsAsync(msg.ChildId, msg.ApplicationId);
        _logger.LogInformation("Seeded default restriction for child {ChildId}, app {ApplicationId}.", msg.ChildId, msg.ApplicationId);
    }
}
