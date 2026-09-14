using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AbilityHub.ServiceClients;
using AbilityHub.Usage.Controllers.DTOs;
using AbilityHub.Usage.Services;

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
    private readonly IChildAccessAuthorizer _access;

    public CheckInsController(ICheckInService checkIns, IChildAccessAuthorizer access)
    {
        _checkIns = checkIns;
        _access = access;
    }

    [HttpPost]
    public async Task<IActionResult> Submit(Guid childId, [FromBody] WeeklyCheckInRequest request)
    {
        if (!await _access.CanManageChildAsync(User, childId)) return Forbid();
        return Ok(await _checkIns.SubmitAsync(childId, request));
    }

    [HttpGet]
    public async Task<IActionResult> Get(Guid childId)
    {
        if (!await _access.CanManageChildAsync(User, childId)) return Forbid();
        return Ok(await _checkIns.GetForChildAsync(childId));
    }

    // DELETE: api/checkins/children/{childId}/{checkInId} — remove one evaluation.
    [HttpDelete("{checkInId:guid}")]
    public async Task<IActionResult> Delete(Guid childId, Guid checkInId)
    {
        if (!await _access.CanManageChildAsync(User, childId)) return Forbid();
        return await _checkIns.DeleteAsync(childId, checkInId) ? NoContent() : NotFound();
    }
}
