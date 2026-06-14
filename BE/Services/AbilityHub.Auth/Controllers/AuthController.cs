using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using AbilityHub.Auth.Controllers.DTOs;
using AbilityHub.Auth.Services.Interfaces;

namespace AbilityHub.Auth.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // POST: api/auth/login
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] AuthRequest request)
    {
        var result = await _authService.LoginAsync(request);

        if (!result.Success)
            return Unauthorized();

        return Ok(result);
    }

    // POST: api/auth/refresh
    [HttpPost("refresh")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        var result = await _authService.RefreshAsync(request);

        if (!result.Success)
            return Unauthorized();

        return Ok(result);
    }

    // POST: api/auth/logout
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest request)
    {
        await _authService.LogoutAsync(request);

        return Ok(new { message = "Logged out successfully" });
    }
}