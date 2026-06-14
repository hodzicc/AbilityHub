using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AbilityHub.ServiceClients;
using AbilityHub.Settings.Controllers.DTOs;
using AbilityHub.Settings.Services;
using AbilityHub.Shared.Common;

namespace AbilityHub.Settings.Controllers;

[ApiController]
[Route("api/settings/children/{childId:guid}")]
[Authorize]
public class PreferencesController : ControllerBase
{
    private readonly ISettingsService _settings;
    private readonly IUsersServiceClient _usersClient;

    public PreferencesController(ISettingsService settings, IUsersServiceClient usersClient)
    {
        _settings = settings;
        _usersClient = usersClient;
    }

    // GET: global preferences for a child.
    [HttpGet("preferences")]
    public async Task<IActionResult> GetGlobal(Guid childId)
    {
        if (!await CanManageChildAsync(childId)) return Forbid();
        return Ok(new PreferencesResponse { Preferences = await _settings.GetPreferencesAsync(childId, null) });
    }

    // PUT: set/merge global preferences.
    [HttpPut("preferences")]
    public async Task<IActionResult> SetGlobal(Guid childId, [FromBody] SetPreferencesRequest request)
    {
        if (!await CanManageChildAsync(childId)) return Forbid();
        await _settings.SetPreferencesAsync(childId, null, request.Preferences);
        return NoContent();
    }

    // GET: per-app override preferences.
    [HttpGet("apps/{appId:guid}/preferences")]
    public async Task<IActionResult> GetForApp(Guid childId, Guid appId)
    {
        if (!await CanManageChildAsync(childId)) return Forbid();
        return Ok(new PreferencesResponse { Preferences = await _settings.GetPreferencesAsync(childId, appId) });
    }

    // PUT: set/merge per-app override preferences.
    [HttpPut("apps/{appId:guid}/preferences")]
    public async Task<IActionResult> SetForApp(Guid childId, Guid appId, [FromBody] SetPreferencesRequest request)
    {
        if (!await CanManageChildAsync(childId)) return Forbid();
        await _settings.SetPreferencesAsync(childId, appId, request.Preferences);
        return NoContent();
    }

    // GET: resolved (merged) settings for an app — what the app applies at login.
    // Readable by the child themselves, a guardian, or an admin.
    [HttpGet("apps/{appId:guid}/resolved")]
    public async Task<IActionResult> GetResolved(Guid childId, Guid appId)
    {
        if (!await CanViewResolvedAsync(childId)) return Forbid();
        return Ok(await _settings.ResolveAsync(childId, appId));
    }

    private Guid CurrentUserId
        => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new InvalidOperationException("Authenticated user has no valid id claim.");

    private async Task<bool> CanManageChildAsync(Guid childId)
    {
        if (User.IsInRole(Roles.Admin)) return true;
        return User.IsInRole(Roles.Parent) && await _usersClient.IsGuardianOfChildAsync(CurrentUserId, childId);
    }

    private async Task<bool> CanViewResolvedAsync(Guid childId)
        => childId == CurrentUserId || await CanManageChildAsync(childId);
}
