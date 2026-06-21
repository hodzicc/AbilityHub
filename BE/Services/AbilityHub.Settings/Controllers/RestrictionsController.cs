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
    private readonly IUsersServiceClient _usersClient;
    private readonly ISettingsNotifier _notifier;

    public RestrictionsController(ISettingsService settings, IUsersServiceClient usersClient, ISettingsNotifier notifier)
    {
        _settings = settings;
        _usersClient = usersClient;
        _notifier = notifier;
    }

    // GET: the usage restriction for a (child, app).
    [HttpGet]
    public async Task<IActionResult> Get(Guid childId, Guid appId)
    {
        if (!await CanManageChildAsync(childId)) return Forbid();
        return Ok(await _settings.GetRestrictionAsync(childId, appId));
    }

    // PUT: set the time limit / block flag (parent or admin).
    [HttpPut]
    public async Task<IActionResult> Set(Guid childId, Guid appId, [FromBody] RestrictionRequest request)
    {
        if (!await CanManageChildAsync(childId)) return Forbid();
        await _settings.SetRestrictionAsync(childId, appId, request, User.GetUserId());
        // Push to the child's connected app so the new limit/block applies instantly.
        await _notifier.NotifyChildAsync(childId, "restriction", appId);
        return NoContent();
    }

    private async Task<bool> CanManageChildAsync(Guid childId)
    {
        if (User.IsInRole(Roles.Admin)) return true;
        return User.IsInRole(Roles.Parent) && await _usersClient.IsGuardianOfChildAsync(User.GetUserId(), childId);
    }
}
