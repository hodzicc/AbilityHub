using MassTransit;
using AbilityHub.AppRegistry.Controllers.DTOs;
using AbilityHub.AppRegistry.Entities;
using AbilityHub.AppRegistry.Repositories;
using AbilityHub.Shared.Events;

namespace AbilityHub.AppRegistry.Services;

/// <summary>
/// Manages which apps a child uses and announces changes to the platform so
/// other services (Settings, Usage) can react.
/// </summary>
public class ChildAppService(
    IApplicationRepository applicationRepository,
    IChildApplicationRepository childApplicationRepository,
    IPublishEndpoint publishEndpoint) : IChildAppService
{
    private readonly IApplicationRepository _applicationRepository = applicationRepository;
    private readonly IChildApplicationRepository _childApplicationRepository = childApplicationRepository;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;

    public async Task<IReadOnlyList<ChildApplicationResponse>> GetForChildAsync(Guid childId)
    {
        var assignments = await _childApplicationRepository.GetForChildAsync(childId);

        return assignments.Select(ca => new ChildApplicationResponse
        {
            ApplicationId = ca.ApplicationId,
            Key = ca.Application?.Key ?? string.Empty,
            Name = ca.Application?.Name ?? string.Empty,
            AssignedAt = ca.AssignedAt
        }).ToList();
    }

    public async Task<AssignmentOutcome> AssignAsync(Guid childId, Guid applicationId, Guid guardianId)
    {
        var application = await _applicationRepository.GetByIdAsync(applicationId);
        if (application is null)
            return AssignmentOutcome.AppNotFound;
        if (!application.IsActive)
            return AssignmentOutcome.AppInactive;

        if (await _childApplicationRepository.ExistsAsync(childId, applicationId))
            return AssignmentOutcome.AlreadyAssigned;

        await _childApplicationRepository.AddAsync(new ChildApplication
        {
            ChildId = childId,
            ApplicationId = applicationId,
            AssignedByGuardianId = guardianId,
            AssignedAt = DateTime.UtcNow
        });

        await _publishEndpoint.Publish(new AppAssignedToChild(
            childId, applicationId, application.Key, guardianId));

        return AssignmentOutcome.Assigned;
    }

    public async Task<bool> RemoveAsync(Guid childId, Guid applicationId)
    {
        var removed = await _childApplicationRepository.RemoveAsync(childId, applicationId);

        if (removed)
            await _publishEndpoint.Publish(new AppRemovedFromChild(childId, applicationId));

        return removed;
    }
}
