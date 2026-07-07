using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AbilityHub.AppRegistry.Controllers.DTOs;
using AbilityHub.AppRegistry.Entities;
using AbilityHub.AppRegistry.Repositories;
using AbilityHub.AppRegistry.Services;
using AbilityHub.Shared.Common;

namespace AbilityHub.AppRegistry.Controllers;

/// <summary>App catalog: browse for everyone, manage for admins.</summary>
[ApiController]
[Route("api/apps")]
[Authorize]
public class ApplicationsController : ControllerBase
{
    private readonly IApplicationRepository _applications;
    private readonly IChildAppService _childApps;
    private readonly IMapper _mapper;

    public ApplicationsController(IApplicationRepository applications, IChildAppService childApps, IMapper mapper)
    {
        _applications = applications;
        _childApps = childApps;
        _mapper = mapper;
    }

    // GET: api/apps — browse the catalog (active only unless an admin asks for all).
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {
        var showAll = includeInactive && User.IsInRole(Roles.Admin);
        var apps = await _applications.GetAllAsync(showAll);
        return Ok(_mapper.Map<List<ApplicationResponse>>(apps));
    }

    // GET: api/apps/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var app = await _applications.GetByIdAsync(id);
        return app is null ? NotFound() : Ok(_mapper.Map<ApplicationResponse>(app));
    }

    // GET: api/apps/{id}/assignments — which children have this app assigned, across
    // the whole platform (admin only — this is the app-centric admin detail view;
    // avoids the caller checking every child's own assignment list one by one).
    [HttpGet("{id:guid}/assignments")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> GetAssignments(Guid id)
        => Ok(await _childApps.GetAssignedChildrenAsync(id));

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
            Category = request.Category,
            IconName = request.IconName,
            Color = request.Color,
            MinAge = request.MinAge,
            MaxAge = request.MaxAge,
            FeaturesJson = request.FeaturesJson,
            IsActive = true,
            CreateUserId = User.GetUserId(),
            CreatedAt = DateTime.UtcNow
        };

        await _applications.AddAsync(app);
        return CreatedAtAction(nameof(GetById), new { id = app.Id }, _mapper.Map<ApplicationResponse>(app));
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
        app.Category = request.Category;
        app.IconName = request.IconName;
        app.Color = request.Color;
        app.MinAge = request.MinAge;
        app.MaxAge = request.MaxAge;
        app.FeaturesJson = request.FeaturesJson;
        app.UpdateUserId = User.GetUserId();
        app.UpdatedAt = DateTime.UtcNow;

        await _applications.UpdateAsync(app);
        return Ok(_mapper.Map<ApplicationResponse>(app));
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
        app.UpdateUserId = User.GetUserId();
        app.UpdatedAt = DateTime.UtcNow;

        await _applications.UpdateAsync(app);
        return NoContent();
    }
}
