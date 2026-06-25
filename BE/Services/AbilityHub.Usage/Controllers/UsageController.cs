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
    // Optional ?applicationIds=id1,id2 scopes every figure to that set of apps (statistics
    // filtering, e.g. the frontend's app-category filter resolved to app ids). Omitting the
    // parameter returns everything; passing it with an empty value returns nothing for that app set.
    // Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD scopes the per-app + daily usage window
    // (week navigation); both default to the last 7 days, clamped to a 90-day lookback.
    [HttpGet("children/{childId:guid}/dashboard")]
    public async Task<IActionResult> Dashboard(
        Guid childId, [FromQuery] string? applicationIds, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        if (!await CanViewChildAsync(childId)) return Forbid();
        return Ok(await _usage.GetDashboardAsync(childId, ParseAppIds(applicationIds), from, to));
    }

    // GET: api/usage/children/{childId}/daily-metrics — per-day activity outcome counts
    // (hints, completed, not-completed, step-backs) for the statistics outcomes chart.
    // Same ?applicationIds / ?from / ?to semantics as the dashboard.
    [HttpGet("children/{childId:guid}/daily-metrics")]
    public async Task<IActionResult> DailyMetrics(
        Guid childId, [FromQuery] string? applicationIds, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        if (!await CanViewChildAsync(childId)) return Forbid();
        return Ok(await _usage.GetDailyMetricsAsync(childId, ParseAppIds(applicationIds), from, to));
    }

    // null = no filter; empty value = an explicit empty set (returns nothing).
    private static List<Guid>? ParseAppIds(string? applicationIds)
    {
        if (applicationIds == null) return null;
        return applicationIds.Length == 0
            ? new List<Guid>()
            : applicationIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(Guid.Parse)
                .ToList();
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
