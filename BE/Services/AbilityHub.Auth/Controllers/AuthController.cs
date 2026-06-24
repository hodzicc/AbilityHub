using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using AbilityHub.Auth.Controllers.DTOs;
using AbilityHub.Auth.Services.Interfaces;
using AbilityHub.Shared.Common;

namespace AbilityHub.Auth.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserService _userService;

    public AuthController(IAuthService authService, IUserService userService)
    {
        _authService = authService;
        _userService = userService;
    }

    // POST: api/auth/register — public endpoint to create a Parent account.
    [HttpPost("register")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Register([FromBody] CreateUserRequest request)
    {
        request.RoleId = Roles.ParentId;
        request.GuardianId = null;

        var result = await _userService.CreateUserAsync(request, guardianId: null);

        if (!result.Success)
            return BadRequest(new ApiError("registration_failed", result.Message));

        // Auto-login after registration
        var loginResult = await _authService.LoginAsync(new AuthRequest
        {
            Email = request.Email,
            Password = request.Password
        });

        return loginResult.Success ? Ok(loginResult) : StatusCode(500);
    }

    // POST: api/auth/login
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] AuthRequest request)
    {
        var result = await _authService.LoginAsync(request);

        if (!result.Success)
            return Unauthorized(result);

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