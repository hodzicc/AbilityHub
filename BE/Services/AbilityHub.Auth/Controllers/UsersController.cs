using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AbilityHub.Auth.Services.Interfaces;
using AbilityHub.Auth.Controllers.DTOs;
using AbilityHub.Shared.Common;

namespace AbilityHub.Users.Controllers;

/// <summary>
/// Identity-side user provisioning (create / deactivate). Lives under the Auth
/// service because it owns credentials; profile reads/relationships are served
/// by the Users service under /api/users.
/// </summary>
[ApiController]
[Route("api/auth/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _service;

    public UsersController(IUserService service)
    {
        _service = service;
    }

    // POST: api/auth/users — Admins create any user; Parents create their own children.
    [HttpPost]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Parent}")]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var isAdmin = User.IsInRole(Roles.Admin);
        Guid? guardianId;

        if (isAdmin)
        {
            // Admin may set any role and optionally assign a guardian.
            guardianId = request.GuardianId;
        }
        else
        {
            // A parent can only create child accounts, and becomes their guardian.
            request.RoleId = Roles.ChildId;
            guardianId = GetCurrentUserId();
        }

        var result = await _service.CreateUserAsync(request, guardianId);

        if (!result.Success)
            return BadRequest(result);

        return CreatedAtAction(nameof(Create), new { id = result.UserId }, result);
    }

    // DELETE: api/auth/users/{id} — deactivate an account (admin only).
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var ok = await _service.DeactivateUserAsync(id);
        return ok ? NoContent() : NotFound();
    }

    // PUT: api/auth/users/{id}/activate — reactivate a previously deactivated account (admin only).
    [HttpPut("{id:guid}/activate")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Activate(Guid id)
    {
        var ok = await _service.ActivateUserAsync(id);
        return ok ? NoContent() : NotFound();
    }

    private Guid GetCurrentUserId()
        => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new InvalidOperationException("Authenticated user has no valid id claim.");
}
