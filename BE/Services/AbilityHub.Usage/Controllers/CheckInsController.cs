using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AbilityHub.ServiceClients;
using AbilityHub.Usage.Controllers.DTOs;
using AbilityHub.Usage.Services;
using AbilityHub.Shared.Common;

namespace AbilityHub.Usage.Controllers;

/// <summary>
/// Weekly parent evaluations ("Procjene roditelja"). These complement the
/// app-reported usage metrics with subjective, real-world context, so they live
/// alongside the statistics they enrich (the Usage service) and are reachable at
/// <c>/api/checkins</c>. Only the child's guardian or an admin may read/write them.
/// </summary>
[ApiController]
[Route("api/checkins/children/{childId:guid}")]
[Authorize]
public class CheckInsController : ControllerBase
{
    private readonly ICheckInService _checkIns;
    private readonly IUsersServiceClient _usersClient;

    public CheckInsController(ICheckInService checkIns, IUsersServiceClient usersClient)
    {
        _checkIns = checkIns;
        _usersClient = usersClient;
    }

    // POST: api/checkins/children/{childId} — create/update this week's evaluation.
    [HttpPost]
    public async Task<IActionResult> Submit(Guid childId, [FromBody] WeeklyCheckInRequest request)
    {
        if (!await CanManageChildAsync(childId)) return Forbid();
        return Ok(await _checkIns.SubmitAsync(childId, request));
    }

    // GET: api/checkins/children/{childId} — the child's evaluation history.
    [HttpGet]
    public async Task<IActionResult> Get(Guid childId)
    {
        if (!await CanManageChildAsync(childId)) return Forbid();
        return Ok(await _checkIns.GetForChildAsync(childId));
    }

    // A parent evaluation is authored about a child by their guardian (or an admin).
    private async Task<bool> CanManageChildAsync(Guid childId)
    {
        if (User.IsInRole(Roles.Admin)) return true;
        return User.IsInRole(Roles.Parent) && await _usersClient.IsGuardianOfChildAsync(User.GetUserId(), childId);
    }
}
