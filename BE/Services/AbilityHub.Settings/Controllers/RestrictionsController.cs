using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AbilityHub.ServiceClients;
using AbilityHub.Settings.Controllers.DTOs;
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

    public RestrictionsController(ISettingsService settings, IUsersServiceClient usersClient)
    {
        _settings = settings;
        _usersClient = usersClient;
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
        await _settings.SetRestrictionAsync(childId, appId, request, CurrentUserId);
        return NoContent();
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
}
