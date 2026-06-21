using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace AbilityHub.Settings.Hubs;

/// <summary>
/// Realtime push channel to clients (mobile/web). A signed-in user joins a group
/// named after their own id, so when a parent changes that child's restriction or
/// preferences the server can push to the child's connected app instantly — no
/// polling. The push carries only a small "what changed" signal; the client then
/// re-fetches the authoritative values (resolved settings / limit-status).
/// </summary>
[Authorize]
public class SettingsHub : Hub
{
    public const string SettingsChanged = "settingsChanged";

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userId))
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);

        await base.OnConnectedAsync();
    }
}
