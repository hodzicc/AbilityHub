using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AbilityHub.ServiceClients;
using AbilityHub.Settings.Controllers.DTOs;
using AbilityHub.Settings.Hubs;
using AbilityHub.Settings.Services;
using AbilityHub.Shared.Common;

namespace AbilityHub.Settings.Controllers;

[ApiController]
[Route("api/settings/children/{childId:guid}/apps/{appId:guid}/restriction")]
[Authorize]
public class RestrictionsController : ControllerBase
{
    private readonly ISettingsService _settings;
    private readonly IChildAccessAuthorizer _access;
    private readonly ISettingsNotifier _notifier;

    public RestrictionsController(ISettingsService settings, IChildAccessAuthorizer access, ISettingsNotifier notifier)
    {
        _settings = settings;
        _access = access;
        _notifier = notifier;
    }

    [HttpGet]
    public async Task<IActionResult> Get(Guid childId, Guid appId)
    {
        if (!await _access.CanManageChildAsync(User, childId)) return Forbid();
        return Ok(await _settings.GetRestrictionAsync(childId, appId));
    }

    [HttpPut]
    public async Task<IActionResult> Set(Guid childId, Guid appId, [FromBody] RestrictionRequest request)
    {
        if (!await _access.CanManageChildAsync(User, childId)) return Forbid();
        await _settings.SetRestrictionAsync(childId, appId, request, User.GetUserId());
        // Push to the child's connected app so the new limit/block applies instantly.
        await _notifier.NotifyChildAsync(childId, "restriction", appId);
        return NoContent();
    }
}
