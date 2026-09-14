using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AbilityHub.ServiceClients;
using AbilityHub.Settings.Controllers.DTOs;
using AbilityHub.Settings.Hubs;
using AbilityHub.Settings.Services;
using AbilityHub.Settings.Validation;

namespace AbilityHub.Settings.Controllers;

[ApiController]
[Route("api/settings/children/{childId:guid}")]
[Authorize]
public class PreferencesController : ControllerBase
{
    private readonly ISettingsService _settings;
    private readonly IChildAccessAuthorizer _access;
    private readonly ISettingsNotifier _notifier;

    public PreferencesController(ISettingsService settings, IChildAccessAuthorizer access, ISettingsNotifier notifier)
    {
        _settings = settings;
        _access = access;
        _notifier = notifier;
    }

    // GET: global preferences for a child.
    [HttpGet("preferences")]
    public async Task<IActionResult> GetGlobal(Guid childId)
    {
        if (!await _access.CanManageChildAsync(User, childId)) return Forbid();
        return Ok(new PreferencesResponse { Preferences = await _settings.GetPreferencesAsync(childId, null) });
    }

    // PUT: set/merge global preferences.
    [HttpPut("preferences")]
    public async Task<IActionResult> SetGlobal(Guid childId, [FromBody] SetPreferencesRequest request)
    {
        if (!await _access.CanManageChildAsync(User, childId)) return Forbid();
        var errors = UIPreferenceCatalog.Validate(request.Preferences);
        if (errors.Count > 0) return BadRequest(new { errors });
        await _settings.SetPreferencesAsync(childId, null, request.Preferences);
        await _notifier.NotifyChildAsync(childId, "preferences", null);
        return NoContent();
    }

    // GET: per-app override preferences.
    [HttpGet("apps/{appId:guid}/preferences")]
    public async Task<IActionResult> GetForApp(Guid childId, Guid appId)
    {
        if (!await _access.CanManageChildAsync(User, childId)) return Forbid();
        return Ok(new PreferencesResponse { Preferences = await _settings.GetPreferencesAsync(childId, appId) });
    }

    // PUT: set/merge per-app override preferences.
    [HttpPut("apps/{appId:guid}/preferences")]
    public async Task<IActionResult> SetForApp(Guid childId, Guid appId, [FromBody] SetPreferencesRequest request)
    {
        if (!await _access.CanManageChildAsync(User, childId)) return Forbid();
        var errors = UIPreferenceCatalog.Validate(request.Preferences);
        if (errors.Count > 0) return BadRequest(new { errors });
        await _settings.SetPreferencesAsync(childId, appId, request.Preferences);
        await _notifier.NotifyChildAsync(childId, "preferences", appId);
        return NoContent();
    }

    // DELETE: remove all per-app overrides — the app falls back to the child's global preferences.
    [HttpDelete("apps/{appId:guid}/preferences")]
    public async Task<IActionResult> ClearForApp(Guid childId, Guid appId)
    {
        if (!await _access.CanManageChildAsync(User, childId)) return Forbid();
        await _settings.ClearAppPreferencesAsync(childId, appId);
        await _notifier.NotifyChildAsync(childId, "preferences", appId);
        return NoContent();
    }

    // GET: resolved (merged) settings for an app — what the app applies at login.
    // Readable by the child themselves, a guardian, or an admin.
    [HttpGet("apps/{appId:guid}/resolved")]
    public async Task<IActionResult> GetResolved(Guid childId, Guid appId)
    {
        if (!await _access.CanViewChildAsync(User, childId)) return Forbid();
        return Ok(await _settings.ResolveAsync(childId, appId));
    }
}
