using Microsoft.AspNetCore.SignalR;

namespace AbilityHub.Usage.Hubs;

public class UsageNotifier(IHubContext<UsageHub> hub, ILogger<UsageNotifier> logger) : IUsageNotifier
{
    private readonly IHubContext<UsageHub> _hub = hub;
    private readonly ILogger<UsageNotifier> _logger = logger;

    // Called fire-and-forget from the report endpoint, so it must never throw: a
    // failed push (e.g. a client dropped mid-send) is logged, not propagated. Safe
    // to run after the request ends because IHubContext is a singleton.
    public async Task NotifyUsageChangedAsync(Guid childId)
    {
        try
        {
            await _hub.Clients.Group(childId.ToString()).SendAsync(UsageHub.UsageChanged, new { childId });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to push usageChanged for {ChildId}.", childId);
        }
    }
}
