using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AbilityHub.AppRegistry.Controllers.DTOs;
using AbilityHub.AppRegistry.Entities;
using AbilityHub.AppRegistry.Repositories;
using AbilityHub.Shared.Common;

namespace AbilityHub.AppRegistry.Controllers;

/// <summary>App catalog: browse for everyone, manage for admins.</summary>
[ApiController]
[Route("api/apps")]
[Authorize]
public class ApplicationsController : ControllerBase
{
    private readonly IApplicationRepository _applications;

    public ApplicationsController(IApplicationRepository applications)
    {
        _applications = applications;
    }

    // GET: api/apps — browse the catalog (active only unless an admin asks for all).
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {
        var showAll = includeInactive && User.IsInRole(Roles.Admin);
        var apps = await _applications.GetAllAsync(showAll);
        return Ok(apps.Select(ToResponse));
    }

    // GET: api/apps/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var app = await _applications.GetByIdAsync(id);
        return app is null ? NotFound() : Ok(ToResponse(app));
    }

    // POST: api/apps — register an app (admin).
    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Register([FromBody] RegisterApplicationRequest request)
    {
        if (await _applications.ExistsByKeyAsync(request.Key))
            return Conflict(new ApiError("duplicate_key", "An application with this key already exists."));

        var app = new Application
        {
            Id = Guid.NewGuid(),
            Key = request.Key,
            Name = request.Name,
            Platform = request.Platform,
            Version = request.Version,
            DataFormat = request.DataFormat,
            Description = request.Description,
            IsActive = true,
            CreateUserId = CurrentUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _applications.AddAsync(app);
        return CreatedAtAction(nameof(GetById), new { id = app.Id }, ToResponse(app));
    }

    // PUT: api/apps/{id} — update (admin).
    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateApplicationRequest request)
    {
        var app = await _applications.GetByIdAsync(id);
        if (app is null)
            return NotFound();

        app.Name = request.Name;
        app.Platform = request.Platform;
        app.Version = request.Version;
        app.DataFormat = request.DataFormat;
        app.Description = request.Description;
        app.IsActive = request.IsActive;
        app.UpdateUserId = CurrentUserId;
        app.UpdatedAt = DateTime.UtcNow;

        await _applications.UpdateAsync(app);
        return Ok(ToResponse(app));
    }

    // DELETE: api/apps/{id} — deactivate (admin, soft delete).
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var app = await _applications.GetByIdAsync(id);
        if (app is null)
            return NotFound();

        app.IsActive = false;
        app.UpdateUserId = CurrentUserId;
        app.UpdatedAt = DateTime.UtcNow;

        await _applications.UpdateAsync(app);
        return NoContent();
    }

    private Guid CurrentUserId
        => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new InvalidOperationException("Authenticated user has no valid id claim.");

    private static ApplicationResponse ToResponse(Application a) => new()
    {
        Id = a.Id,
        Key = a.Key,
        Name = a.Name,
        Platform = a.Platform,
        Version = a.Version,
        DataFormat = a.DataFormat,
        Description = a.Description,
        IsActive = a.IsActive
    };
}
