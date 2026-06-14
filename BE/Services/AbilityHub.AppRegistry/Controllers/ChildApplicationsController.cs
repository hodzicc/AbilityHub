using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AbilityHub.AppRegistry.Controllers.DTOs;
using AbilityHub.AppRegistry.Services;
using AbilityHub.ServiceClients;
using AbilityHub.Shared.Common;

namespace AbilityHub.AppRegistry.Controllers;

/// <summary>
/// The apps a child uses. Admins manage any child; parents only their own
/// children (verified against the Users service).
/// </summary>
[ApiController]
[Route("api/apps/children")]
[Authorize]
public class ChildApplicationsController : ControllerBase
{
    private readonly IChildAppService _childApps;
    private readonly IUsersServiceClient _usersClient;

    public ChildApplicationsController(IChildAppService childApps, IUsersServiceClient usersClient)
    {
        _childApps = childApps;
        _usersClient = usersClient;
    }

    // GET: api/apps/children/{childId} — apps assigned to a child.
    [HttpGet("{childId:guid}")]
    public async Task<IActionResult> GetForChild(Guid childId)
    {
        if (!await CanManageChildAsync(childId))
            return Forbid();

        return Ok(await _childApps.GetForChildAsync(childId));
    }

    // POST: api/apps/children/{childId} — assign an app to a child.
    [HttpPost("{childId:guid}")]
    public async Task<IActionResult> Assign(Guid childId, [FromBody] AssignAppRequest request)
    {
        if (!await CanManageChildAsync(childId))
            return Forbid();

        var outcome = await _childApps.AssignAsync(childId, request.ApplicationId, CurrentUserId);

        return outcome switch
        {
            AssignmentOutcome.Assigned => NoContent(),
            AssignmentOutcome.AlreadyAssigned => Conflict(new ApiError("already_assigned", "App is already assigned to this child.")),
            AssignmentOutcome.AppNotFound => NotFound(new ApiError("app_not_found", "Application does not exist.")),
            AssignmentOutcome.AppInactive => BadRequest(new ApiError("app_inactive", "Application is not available for assignment.")),
            _ => StatusCode(500)
        };
    }

    // DELETE: api/apps/children/{childId}/{applicationId} — remove an app from a child.
    [HttpDelete("{childId:guid}/{applicationId:guid}")]
    public async Task<IActionResult> Remove(Guid childId, Guid applicationId)
    {
        if (!await CanManageChildAsync(childId))
            return Forbid();

        var removed = await _childApps.RemoveAsync(childId, applicationId);
        return removed ? NoContent() : NotFound();
    }

    private Guid CurrentUserId
        => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new InvalidOperationException("Authenticated user has no valid id claim.");

    /// <summary>Admins manage any child; parents only children they are a guardian of.</summary>
    private async Task<bool> CanManageChildAsync(Guid childId)
    {
        if (User.IsInRole(Roles.Admin))
            return true;

        return User.IsInRole(Roles.Parent)
            && await _usersClient.IsGuardianOfChildAsync(CurrentUserId, childId);
    }
}
