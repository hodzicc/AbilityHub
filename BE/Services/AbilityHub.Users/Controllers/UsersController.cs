using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AbilityHub.Shared.Common;
using AbilityHub.Users.Controllers.DTOs;
using AbilityHub.Users.Entities;
using AbilityHub.Users.Repositories;

namespace AbilityHub.Users.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public UsersController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    // GET: api/users?page=1&pageSize=20 — full directory (admin only).
    [HttpGet]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, total) = await _userRepository.GetPagedAsync(page, pageSize);

        return Ok(new PagedResult<UserProfileResponse>(
            items.Select(ToResponse).ToList(), page, pageSize, total));
    }

    // GET: api/users/me — the current user's own profile.
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var user = await _userRepository.GetByIdAsync(CurrentUserId);
        return user is null ? NotFound() : Ok(ToResponse(user));
    }

    // GET: api/users/{id} — admin, the user themselves, or a guardian of that user.
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (!await CanAccessUserAsync(id))
            return Forbid();

        var user = await _userRepository.GetByIdAsync(id);
        return user is null ? NotFound() : Ok(ToResponse(user));
    }

    // PUT: api/users/{id} — update profile (admin or the user themselves).
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProfileRequest request)
    {
        if (!(IsAdmin || id == CurrentUserId))
            return Forbid();

        var user = await _userRepository.GetByIdAsync(id);
        if (user is null)
            return NotFound();

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        if (request.DateOfBirth.HasValue) user.DateOfBirth = request.DateOfBirth;
        if (request.Gender is not null) user.Gender = request.Gender;
        user.UpdateUserId = CurrentUserId;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
        return Ok(ToResponse(user));
    }

    // GET: api/users/{guardianId}/children — children of a guardian (admin or that guardian).
    [HttpGet("{guardianId:guid}/children")]
    public async Task<IActionResult> GetChildren(Guid guardianId)
    {
        if (!(IsAdmin || guardianId == CurrentUserId))
            return Forbid();

        var children = await _userRepository.GetChildrenAsync(guardianId);
        return Ok(children.Select(ToResponse));
    }

    // POST: api/users/{guardianId}/children — link a child (admin or that guardian).
    [HttpPost("{guardianId:guid}/children")]
    public async Task<IActionResult> LinkChild(Guid guardianId, [FromBody] LinkChildRequest request)
    {
        if (!(IsAdmin || guardianId == CurrentUserId))
            return Forbid();

        var guardian = await _userRepository.GetByIdAsync(guardianId);
        if (guardian is null || guardian.RoleId != Roles.ParentId)
            return BadRequest(new ApiError("invalid_guardian", "Guardian must be an existing parent."));

        var child = await _userRepository.GetByIdAsync(request.ChildId);
        if (child is null || child.RoleId != Roles.ChildId)
            return BadRequest(new ApiError("invalid_child", "Child must be an existing child user."));

        if (await _userRepository.LinkExistsAsync(guardianId, request.ChildId))
            return Conflict(new ApiError("already_linked", "This child is already linked to the guardian."));

        await _userRepository.AddLinkAsync(new GuardianChild
        {
            GuardianId = guardianId,
            ChildId = request.ChildId,
            LinkedAt = DateTime.UtcNow
        });

        return NoContent();
    }

    // DELETE: api/users/{guardianId}/children/{childId} — unlink (admin or that guardian).
    [HttpDelete("{guardianId:guid}/children/{childId:guid}")]
    public async Task<IActionResult> UnlinkChild(Guid guardianId, Guid childId)
    {
        if (!(IsAdmin || guardianId == CurrentUserId))
            return Forbid();

        var removed = await _userRepository.RemoveLinkAsync(guardianId, childId);
        return removed ? NoContent() : NotFound();
    }

    // --- authorization helpers ---

    private Guid CurrentUserId
        => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new InvalidOperationException("Authenticated user has no valid id claim.");

    private bool IsAdmin => User.IsInRole(Roles.Admin);

    private async Task<bool> CanAccessUserAsync(Guid targetUserId)
    {
        if (IsAdmin || targetUserId == CurrentUserId)
            return true;

        // A parent may view their own children.
        return User.IsInRole(Roles.Parent)
            && await _userRepository.IsGuardianOfAsync(CurrentUserId, targetUserId);
    }

    private static UserProfileResponse ToResponse(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FirstName = user.FirstName,
        LastName = user.LastName,
        RoleId = user.RoleId,
        IsActive = user.IsActive,
        DateOfBirth = user.DateOfBirth,
        Gender = user.Gender,
        CreatedAt = user.CreatedAt
    };
}
