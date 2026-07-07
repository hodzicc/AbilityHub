using AutoMapper;
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
    private readonly IMapper _mapper;

    public UsersController(IUserRepository userRepository, IMapper mapper)
    {
        _userRepository = userRepository;
        _mapper = mapper;
    }

    // GET: api/users?page=1&pageSize=20&search=...&roleId=... — full directory (admin only).
    // Search matches first name, last name, or email and is applied server-side, so
    // it works correctly together with pagination instead of only filtering whichever
    // single page the client happened to have loaded. roleId narrows to one role (e.g.
    // picking a guardian from the parent list) without the caller paging through everyone.
    [HttpGet]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] int? roleId = null)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, total) = await _userRepository.GetPagedAsync(page, pageSize, search, roleId);

        return Ok(new PagedResult<UserProfileResponse>(
            _mapper.Map<List<UserProfileResponse>>(items), page, pageSize, total));
    }

    // GET: api/users/summary — role counts + per-guardian child counts across the
    // whole directory (admin only), for dashboard cards that must stay accurate no
    // matter how many users exist — not derived from whatever page is loaded.
    [HttpGet("summary")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> GetSummary()
    {
        var counts = await _userRepository.GetRoleCountsAsync();
        var childCountsByGuardian = await _userRepository.GetChildCountsByGuardianAsync();

        return Ok(new UserSummaryResponse
        {
            TotalUsers = counts.Total,
            AdminCount = counts.Admins,
            ParentCount = counts.Parents,
            ChildCount = counts.Children,
            ChildCountsByGuardian = childCountsByGuardian,
        });
    }

    // GET: api/users/me — the current user's own profile.
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var user = await _userRepository.GetByIdAsync(User.GetUserId());
        return user is null ? NotFound() : Ok(_mapper.Map<UserProfileResponse>(user));
    }

    // GET: api/users/{id} — admin, the user themselves, or a guardian of that user.
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (!await CanAccessUserAsync(id))
            return Forbid();

        var user = await _userRepository.GetByIdAsync(id);
        return user is null ? NotFound() : Ok(_mapper.Map<UserProfileResponse>(user));
    }

    // PUT: api/users/{id} — update profile (admin, the user themselves, or a guardian
    // of that user — so a parent can edit their child's name/DOB/gender).
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProfileRequest request)
    {
        if (!await CanAccessUserAsync(id))
            return Forbid();

        var user = await _userRepository.GetByIdAsync(id);
        if (user is null)
            return NotFound();

        _mapper.Map(request, user);
        user.UpdateUserId = User.GetUserId();
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
        return Ok(_mapper.Map<UserProfileResponse>(user));
    }

    // GET: api/users/{guardianId}/children — children of a guardian (admin or that guardian).
    [HttpGet("{guardianId:guid}/children")]
    public async Task<IActionResult> GetChildren(Guid guardianId)
    {
        if (!(IsAdmin || guardianId == User.GetUserId()))
            return Forbid();

        var children = await _userRepository.GetChildrenAsync(guardianId);
        return Ok(_mapper.Map<List<UserProfileResponse>>(children));
    }

    // POST: api/users/{guardianId}/children — link a child (admin or that guardian).
    [HttpPost("{guardianId:guid}/children")]
    public async Task<IActionResult> LinkChild(Guid guardianId, [FromBody] LinkChildRequest request)
    {
        if (!(IsAdmin || guardianId == User.GetUserId()))
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
        if (!(IsAdmin || guardianId == User.GetUserId()))
            return Forbid();

        var removed = await _userRepository.RemoveLinkAsync(guardianId, childId);
        return removed ? NoContent() : NotFound();
    }

    // --- authorization helpers ---

    private bool IsAdmin => User.IsInRole(Roles.Admin);

    private async Task<bool> CanAccessUserAsync(Guid targetUserId)
    {
        if (IsAdmin || targetUserId == User.GetUserId())
            return true;

        // A parent may view their own children.
        return User.IsInRole(Roles.Parent)
            && await _userRepository.IsGuardianOfAsync(User.GetUserId(), targetUserId);
    }
}
