using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using AbilityHub.Auth.Controllers.DTOs;
using AbilityHub.Auth.Services.Interfaces;
using AbilityHub.ServiceClients;
using AbilityHub.Shared.Common;

namespace AbilityHub.Auth.Controllers;

/// <summary>
/// QR-code device pairing for child login. A guardian (or admin) issues a
/// short-lived, single-use token; the mobile app scans the QR (which encodes
/// <c>{ childId, token }</c>) and exchanges the token for a normal session.
/// Mirrors the QR login used by the team's other Down Syndrome Association apps.
/// </summary>
[ApiController]
[Route("api/auth")]
public class PairingController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IChildAccessAuthorizer _access;

    public PairingController(IAuthService authService, IChildAccessAuthorizer access)
    {
        _authService = authService;
        _access = access;
    }

    // POST: api/auth/children/{childId}/pairing-token — guardian/admin issues a code.
    [HttpPost("children/{childId:guid}/pairing-token")]
    [Authorize]
    public async Task<IActionResult> CreatePairingToken(Guid childId)
    {
        if (!await _access.CanManageChildAsync(User, childId)) return Forbid();

        var token = await _authService.CreatePairingTokenAsync(childId);
        return token is null
            ? NotFound(new ApiError("not_a_child", "No active child account with that id."))
            : Ok(token);
    }

    // POST: api/auth/pairing/exchange — mobile app redeems a scanned code for a session.
    [HttpPost("pairing/exchange")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Exchange([FromBody] PairingExchangeRequest request)
    {
        var result = await _authService.ExchangePairingTokenAsync(request);
        return result.Success ? Ok(result) : Unauthorized(result);
    }
}
