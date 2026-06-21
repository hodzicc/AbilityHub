using Microsoft.AspNetCore.SignalR;

namespace AbilityHub.Settings.Hubs;

public class SettingsNotifier(IHubContext<SettingsHub> hub) : ISettingsNotifier
{
    private readonly IHubContext<SettingsHub> _hub = hub;

    public Task NotifyChildAsync(Guid childId, string type, Guid? applicationId)
        => _hub.Clients
            .Group(childId.ToString())
            .SendAsync(SettingsHub.SettingsChanged, new
            {
                type,
                applicationId,
            });
}
