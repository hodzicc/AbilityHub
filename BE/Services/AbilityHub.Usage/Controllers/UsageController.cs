using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AbilityHub.ServiceClients;
using AbilityHub.Usage.Controllers.DTOs;
using AbilityHub.Usage.Services;
using AbilityHub.Shared.Common;

namespace AbilityHub.Usage.Controllers;

[ApiController]
[Route("api/usage")]
[Authorize]
public class UsageController : ControllerBase
{
    private readonly IUsageService _usage;
    private readonly IUsersServiceClient _usersClient;

    public UsageController(IUsageService usage, IUsersServiceClient usersClient)
    {
        _usage = usage;
        _usersClient = usersClient;
    }

    // POST: api/usage/report — an app reports usage for the signed-in child (self).
    [HttpPost("report")]
    public async Task<IActionResult> Report([FromBody] UsageReportRequest report)
    {
        // Usage is always recorded for the authenticated caller — no reporting on someone else's behalf.
        await _usage.ReportAsync(CurrentUserId, report);
        return Accepted();
    }

    // GET: api/usage/children/{childId}/dashboard — stats for the web app.
    [HttpGet("children/{childId:guid}/dashboard")]
    public async Task<IActionResult> Dashboard(Guid childId)
    {
        if (!await CanViewChildAsync(childId)) return Forbid();
        return Ok(await _usage.GetDashboardAsync(childId));
    }

    // GET: api/usage/children/{childId}/apps/{appId}/limit-status — remaining allowance vs Settings limits.
    [HttpGet("children/{childId:guid}/apps/{appId:guid}/limit-status")]
    public async Task<IActionResult> LimitStatus(Guid childId, Guid appId)
    {
        if (!await CanViewChildAsync(childId)) return Forbid();
        return Ok(await _usage.GetLimitStatusAsync(childId, appId));
    }

    private Guid CurrentUserId
        => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new InvalidOperationException("Authenticated user has no valid id claim.");

    // The child themselves, a guardian of the child, or an admin.
    private async Task<bool> CanViewChildAsync(Guid childId)
    {
        if (childId == CurrentUserId || User.IsInRole(Roles.Admin))
            return true;

        return User.IsInRole(Roles.Parent)
            && await _usersClient.IsGuardianOfChildAsync(CurrentUserId, childId);
    }
}
