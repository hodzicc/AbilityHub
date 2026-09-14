using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AbilityHub.Auth.Services.Interfaces;
using AbilityHub.Auth.Controllers.DTOs;
using AbilityHub.ServiceClients;
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
    private readonly IChildAccessAuthorizer _access;

    public UsersController(IUserService service, IChildAccessAuthorizer access)
    {
        _service = service;
        _access = access;
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
            guardianId = User.GetUserId();
        }

        var result = await _service.CreateUserAsync(request, guardianId);

        if (!result.Success)
            return BadRequest(result);

        return CreatedAtAction(nameof(Create), new { id = result.UserId }, result);
    }

    // DELETE: api/auth/users/{id} — deactivate an account. An admin may deactivate any
    // account; a parent may deactivate a child they are the guardian of (deleting their
    // own child's account). Nobody may deactivate themselves — that could lock an admin
    // out of the platform with no one left to reactivate it.
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Parent}")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        if (id == User.GetUserId())
            return BadRequest(new ApiError("cannot_deactivate_self", "You cannot deactivate your own account."));

        // Admin passes unconditionally; a parent only for their own child.
        if (!await _access.CanManageChildAsync(User, id))
            return Forbid();

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
}
