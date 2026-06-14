using MassTransit;
using AbilityHub.Settings.Repositories;
using AbilityHub.Shared.Events;

namespace AbilityHub.Settings.Consumers;

/// <summary>
/// When AppRegistry removes an app from a child, discard that child's per-app
/// preferences and restriction. Idempotent.
/// </summary>
public class AppRemovedFromChildConsumer(
    IPreferenceRepository preferences,
    IRestrictionRepository restrictions,
    ILogger<AppRemovedFromChildConsumer> logger) : IConsumer<AppRemovedFromChild>
{
    private readonly IPreferenceRepository _preferences = preferences;
    private readonly IRestrictionRepository _restrictions = restrictions;
    private readonly ILogger<AppRemovedFromChildConsumer> _logger = logger;

    public async Task Consume(ConsumeContext<AppRemovedFromChild> context)
    {
        var msg = context.Message;
        await _preferences.DeleteForAppAsync(msg.ChildId, msg.ApplicationId);
        await _restrictions.DeleteAsync(msg.ChildId, msg.ApplicationId);
        _logger.LogInformation("Cleared settings for child {ChildId}, app {ApplicationId}.", msg.ChildId, msg.ApplicationId);
    }
}
