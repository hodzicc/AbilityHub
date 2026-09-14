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
    private readonly IChildAccessAuthorizer _access;
    private readonly IUsersServiceClient _usersClient;
    private readonly IUsageNotifier _notifier;

    public UsageController(IUsageService usage, IChildAccessAuthorizer access, IUsersServiceClient usersClient, IUsageNotifier notifier)
    {
        _usage = usage;
        _access = access;
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
        if (!await _access.CanViewChildAsync(User, childId)) return Forbid();
        return Ok(await _usage.GetDashboardAsync([childId], ParseAppIds(applicationIds), from, to));
    }

    // GET: api/usage/children/{childId}/daily-metrics — per-day activity outcome counts
    // (hints, completed, not-completed, step-backs) for the statistics outcomes chart.
    // Same ?applicationIds / ?from / ?to semantics as the dashboard.
    [HttpGet("children/{childId:guid}/daily-metrics")]
    public async Task<IActionResult> DailyMetrics(
        Guid childId, [FromQuery] string? applicationIds, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        if (!await _access.CanViewChildAsync(User, childId)) return Forbid();
        return Ok(await _usage.GetDailyMetricsAsync([childId], ParseAppIds(applicationIds), from, to));
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

    // GET: api/usage/dashboard — aggregate usage snapshot for the caller's own scope,
    // computed in one backend pass: an admin sees every child on the platform; a parent
    // sees their own children combined. Replaces the client fetching one dashboard per
    // child and summing the figures itself. Scope is decided by role here, so there is
    // one endpoint rather than a separate admin route doing the same computation.
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        IReadOnlyCollection<Guid>? childIds = User.IsInRole(Roles.Admin)
            ? null // null = every child (platform-wide)
            : (await _usersClient.GetChildIdsForGuardianAsync(User.GetUserId())).ToList();

        return Ok(await _usage.GetAggregateDashboardAsync(childIds));
    }

    // GET: api/usage/progress — average step-completion progress per child across the
    // caller's own scope (admin: every child; parent: their own), in one call — so a
    // list view doesn't fetch a full dashboard per child just to show a progress figure.
    [HttpGet("progress")]
    public async Task<IActionResult> ChildrenProgress()
    {
        IReadOnlyCollection<Guid>? childIds = User.IsInRole(Roles.Admin)
            ? null
            : (await _usersClient.GetChildIdsForGuardianAsync(User.GetUserId())).ToList();

        return Ok(await _usage.GetChildrenProgressAsync(childIds));
    }

    // GET: api/usage/children/{childId}/calendar?year=2026&month=7 — which days in that
    // month have any activity, for the statistics calendar's month grid.
    [HttpGet("children/{childId:guid}/calendar")]
    public async Task<IActionResult> CalendarMonth(
        Guid childId, [FromQuery] int year, [FromQuery] int month, [FromQuery] string? applicationIds)
    {
        if (!await _access.CanViewChildAsync(User, childId)) return Forbid();
        if (month is < 1 or > 12) return BadRequest(new ApiError("invalid_month", "Month must be between 1 and 12."));
        return Ok(await _usage.GetCalendarMonthAsync([childId], year, month, ParseAppIds(applicationIds)));
    }

    // GET: api/usage/children/{childId}/activities-on-date?date=2026-07-03 — every
    // activity the child had that day, for the calendar's day drill-down.
    [HttpGet("children/{childId:guid}/activities-on-date")]
    public async Task<IActionResult> ActivitiesOnDate(Guid childId, [FromQuery] DateTime date, [FromQuery] string? applicationIds)
    {
        if (!await _access.CanViewChildAsync(User, childId)) return Forbid();
        return Ok(await _usage.GetActivitiesOnDateAsync([childId], date, ParseAppIds(applicationIds)));
    }

    // GET: api/usage/children/{childId}/apps/{appId}/limit-status — remaining allowance vs Settings limits.
    [HttpGet("children/{childId:guid}/apps/{appId:guid}/limit-status")]
    public async Task<IActionResult> LimitStatus(Guid childId, Guid appId)
    {
        if (!await _access.CanViewChildAsync(User, childId)) return Forbid();
        return Ok(await _usage.GetLimitStatusAsync(childId, appId));
    }

    // ---- Combined views over several children at once (the statistics page's "All
    // children" mode), computed in one query rather than the client fetching a dashboard
    // per child and summing. Same shapes and ?applicationIds / date / window semantics as
    // the per-child routes above; ?childIds=a,b,c selects the children, always narrowed to
    // the ones the caller may actually see. ----

    // GET: api/usage/combined/dashboard?childIds=a,b&applicationIds=&from=&to=
    [HttpGet("combined/dashboard")]
    public async Task<IActionResult> CombinedDashboard(
        [FromQuery] string? childIds, [FromQuery] string? applicationIds, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(await _usage.GetDashboardAsync(await ScopedChildrenAsync(childIds), ParseAppIds(applicationIds), from, to));

    // GET: api/usage/combined/daily-metrics?childIds=a,b&applicationIds=&from=&to=
    [HttpGet("combined/daily-metrics")]
    public async Task<IActionResult> CombinedDailyMetrics(
        [FromQuery] string? childIds, [FromQuery] string? applicationIds, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(await _usage.GetDailyMetricsAsync(await ScopedChildrenAsync(childIds), ParseAppIds(applicationIds), from, to));

    // GET: api/usage/combined/calendar?childIds=a,b&year=2026&month=7&applicationIds=
    [HttpGet("combined/calendar")]
    public async Task<IActionResult> CombinedCalendar(
        [FromQuery] string? childIds, [FromQuery] int year, [FromQuery] int month, [FromQuery] string? applicationIds)
    {
        if (month is < 1 or > 12) return BadRequest(new ApiError("invalid_month", "Month must be between 1 and 12."));
        return Ok(await _usage.GetCalendarMonthAsync(await ScopedChildrenAsync(childIds), year, month, ParseAppIds(applicationIds)));
    }

    // GET: api/usage/combined/activities-on-date?childIds=a,b&date=2026-07-03&applicationIds=
    [HttpGet("combined/activities-on-date")]
    public async Task<IActionResult> CombinedActivitiesOnDate(
        [FromQuery] string? childIds, [FromQuery] DateTime date, [FromQuery] string? applicationIds)
        => Ok(await _usage.GetActivitiesOnDateAsync(await ScopedChildrenAsync(childIds), date, ParseAppIds(applicationIds)));

    // Resolves the requested child ids to those the caller may actually view: an admin
    // gets the set as-is; anyone else has it intersected with their own children (a single
    // guardian lookup), so passing another guardian's child id yields nothing rather than
    // leaking data. An absent/empty parameter yields an empty set (no children → no data).
    private async Task<IReadOnlyCollection<Guid>> ScopedChildrenAsync(string? childIds)
    {
        var requested = ParseAppIds(childIds) ?? new List<Guid>();
        if (requested.Count == 0 || User.IsInRole(Roles.Admin))
            return requested;

        var mine = (await _usersClient.GetChildIdsForGuardianAsync(User.GetUserId())).ToHashSet();
        return requested.Where(mine.Contains).ToList();
    }
}
