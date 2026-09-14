using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AbilityHub.ServiceClients;
using AbilityHub.Usage.Services;
using AbilityHub.Shared.Common;

namespace AbilityHub.Usage.Controllers;

/// <summary>
/// Cross-child check-in summary for the signed-in guardian. Kept separate from the
/// child-scoped <see cref="CheckInsController"/> because it answers a question about
/// the caller's whole set of children at once, not one child.
/// </summary>
[ApiController]
[Route("api/checkins/pending")]
[Authorize]
public class PendingCheckInsController : ControllerBase
{
    private readonly ICheckInService _checkIns;
    private readonly IUsersServiceClient _usersClient;

    public PendingCheckInsController(ICheckInService checkIns, IUsersServiceClient usersClient)
    {
        _checkIns = checkIns;
        _usersClient = usersClient;
    }

    // GET: api/checkins/pending?weekStart=2026-09-07 — of the caller's own children,
    // the ids that still have no check-in for that week. Lets the dashboard render its
    // reminder with one call instead of fetching every child's check-ins and diffing
    // them client-side. The week is supplied by the caller so "this week" matches the
    // client's own locale (the same value the check-in form submits).
    [HttpGet]
    public async Task<IActionResult> Pending([FromQuery] DateOnly weekStart)
    {
        var childIds = await _usersClient.GetChildIdsForGuardianAsync(User.GetUserId());
        return Ok(await _checkIns.GetChildrenMissingCheckInAsync(childIds, weekStart));
    }
}
