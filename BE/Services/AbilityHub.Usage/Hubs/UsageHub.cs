using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using AbilityHub.Shared.Common;

namespace AbilityHub.Usage.Hubs;

/// <summary>
/// Realtime fan-out of usage activity. When a child reports usage (time, an
/// activity, or live step progress) the server pushes a content-free
/// <c>usageChanged</c> signal for that child; subscribers then re-fetch the
/// authoritative dashboard over the normal (authorized) REST endpoint.
///
/// A child auto-joins their own group on connect; a guardian/admin subscribes to a
/// child via <see cref="WatchChild"/>. The signal carries no data, and the
/// dashboard REST endpoint still enforces the full guardian check, so a subscription
/// can at most reveal that *something* changed — never the data itself.
/// </summary>
[Authorize]
public class UsageHub : Hub
{
    public const string UsageChanged = "usageChanged";

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userId))
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);

        await base.OnConnectedAsync();
    }

    /// <summary>Subscribe to a child's live usage (guardian/admin, or the child themselves).</summary>
    public async Task WatchChild(string childId)
    {
        if (!Guid.TryParse(childId, out _)) return;

        var me = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        var isSelf = string.Equals(me, childId, StringComparison.OrdinalIgnoreCase);

        // Coarse gate; the content-free ping plus REST-side authorization make this safe.
        if (isSelf || Context.User!.IsInRole(Roles.Admin) || Context.User!.IsInRole(Roles.Parent))
            await Groups.AddToGroupAsync(Context.ConnectionId, childId);
    }
}
