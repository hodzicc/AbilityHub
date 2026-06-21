using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AbilityHub.ServiceClients;
using AbilityHub.Usage.Controllers.DTOs;
using AbilityHub.Usage.Hubs;
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
    private readonly IUsageNotifier _notifier;

    public UsageController(IUsageService usage, IUsersServiceClient usersClient, IUsageNotifier notifier)
    {
        _usage = usage;
        _usersClient = usersClient;
        _notifier = notifier;
    }

    // POST: api/usage/report — an app reports usage for the signed-in child (self).
    [HttpPost("report")]
    public async Task<IActionResult> Report([FromBody] UsageReportRequest report)
    {
        // Usage is always recorded for the authenticated caller — no reporting on someone else's behalf.
        await _usage.ReportAsync(User.GetUserId(), report);
        // Fire-and-forget the realtime ping: it's a best-effort side-effect, so the
        // report response must not wait on the fan-out. The notifier swallows its own
        // errors, and IHubContext is a singleton, so this is safe after the request ends.
        _ = _notifier.NotifyUsageChangedAsync(User.GetUserId());
        return Accepted();
    }

    // GET: api/usage/children/{childId}/dashboard — stats for the web app.
    // Optional ?activityType= scopes activity-based figures to one type (statistics filtering).
    [HttpGet("children/{childId:guid}/dashboard")]
    public async Task<IActionResult> Dashboard(Guid childId, [FromQuery] string? activityType)
    {
        if (!await CanViewChildAsync(childId)) return Forbid();
        return Ok(await _usage.GetDashboardAsync(childId, activityType));
    }

    // GET: api/usage/children/{childId}/apps/{appId}/limit-status — remaining allowance vs Settings limits.
    [HttpGet("children/{childId:guid}/apps/{appId:guid}/limit-status")]
    public async Task<IActionResult> LimitStatus(Guid childId, Guid appId)
    {
        if (!await CanViewChildAsync(childId)) return Forbid();
        return Ok(await _usage.GetLimitStatusAsync(childId, appId));
    }

    // The child themselves, a guardian of the child, or an admin.
    private async Task<bool> CanViewChildAsync(Guid childId)
    {
        if (childId == User.GetUserId() || User.IsInRole(Roles.Admin))
            return true;

        return User.IsInRole(Roles.Parent)
            && await _usersClient.IsGuardianOfChildAsync(User.GetUserId(), childId);
    }
}
