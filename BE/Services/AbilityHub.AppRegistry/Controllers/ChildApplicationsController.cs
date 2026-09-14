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
    private readonly IChildAccessAuthorizer _access;

    public ChildApplicationsController(IChildAppService childApps, IChildAccessAuthorizer access)
    {
        _childApps = childApps;
        _access = access;
    }

    // GET: api/apps/children/{childId} — apps assigned to a child.
    [HttpGet("{childId:guid}")]
    public async Task<IActionResult> GetForChild(Guid childId)
    {
        // A child may read their OWN assignments — the app uses this to confirm it's
        // assigned before letting the child in. Otherwise only an admin or guardian.
        if (!await _access.CanViewChildAsync(User, childId))
            return Forbid();

        return Ok(await _childApps.GetForChildAsync(childId));
    }

    // POST: api/apps/children/{childId} — assign an app to a child.
    [HttpPost("{childId:guid}")]
    public async Task<IActionResult> Assign(Guid childId, [FromBody] AssignAppRequest request)
    {
        if (!await _access.CanManageChildAsync(User, childId))
            return Forbid();

        var outcome = await _childApps.AssignAsync(childId, request.ApplicationId, User.GetUserId());

        return outcome switch
        {
            AssignmentOutcome.Assigned => NoContent(),
            AssignmentOutcome.AlreadyAssigned => Conflict(new ApiError("already_assigned", "App is already assigned to this child.")),
            AssignmentOutcome.AppNotFound => NotFound(new ApiError("app_not_found", "Application does not exist.")),
            AssignmentOutcome.AppInactive => BadRequest(new ApiError("app_inactive", "Application is not available for assignment.")),
            AssignmentOutcome.AgeOutOfRange => BadRequest(new ApiError("age_out_of_range", "The child's age is outside this app's allowed range.")),
            _ => StatusCode(500)
        };
    }

    // DELETE: api/apps/children/{childId}/{applicationId} — remove an app from a child.
    [HttpDelete("{childId:guid}/{applicationId:guid}")]
    public async Task<IActionResult> Remove(Guid childId, Guid applicationId)
    {
        if (!await _access.CanManageChildAsync(User, childId))
            return Forbid();

        var removed = await _childApps.RemoveAsync(childId, applicationId);
        return removed ? NoContent() : NotFound();
    }
}
