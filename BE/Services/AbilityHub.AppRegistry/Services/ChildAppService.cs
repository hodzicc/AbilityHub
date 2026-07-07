using AutoMapper;
using MassTransit;
using AbilityHub.AppRegistry.Controllers.DTOs;
using AbilityHub.AppRegistry.Entities;
using AbilityHub.AppRegistry.Repositories;
using AbilityHub.ServiceClients;
using AbilityHub.Shared.Events;

namespace AbilityHub.AppRegistry.Services;

/// <summary>
/// Manages which apps a child uses and announces changes to the platform so
/// other services (Settings, Usage) can react.
/// </summary>
public class ChildAppService(
    IApplicationRepository applicationRepository,
    IChildApplicationRepository childApplicationRepository,
    IUsersServiceClient usersClient,
    IPublishEndpoint publishEndpoint,
    IMapper mapper) : IChildAppService
{
    private readonly IApplicationRepository _applicationRepository = applicationRepository;
    private readonly IChildApplicationRepository _childApplicationRepository = childApplicationRepository;
    private readonly IUsersServiceClient _usersClient = usersClient;
    private readonly IPublishEndpoint _publishEndpoint = publishEndpoint;
    private readonly IMapper _mapper = mapper;

    public async Task<IReadOnlyList<ChildApplicationResponse>> GetForChildAsync(Guid childId)
    {
        var assignments = await _childApplicationRepository.GetForChildAsync(childId);

        return _mapper.Map<List<ChildApplicationResponse>>(assignments);
    }

    public async Task<IReadOnlyList<AppAssignmentResponse>> GetAssignedChildrenAsync(Guid applicationId)
    {
        var assignments = await _childApplicationRepository.GetForApplicationAsync(applicationId);

        return assignments
            .Select(a => new AppAssignmentResponse { ChildId = a.ChildId, AssignedAt = a.AssignedAt })
            .ToList();
    }

    public async Task<AssignmentOutcome> AssignAsync(Guid childId, Guid applicationId, Guid guardianId)
    {
        var application = await _applicationRepository.GetByIdAsync(applicationId);
        if (application is null)
            return AssignmentOutcome.AppNotFound;
        if (!application.IsActive)
            return AssignmentOutcome.AppInactive;

        // Enforce the app's age range. If the child's date of birth is unknown we
        // can't compute an age, so we don't block the assignment on that basis.
        var dateOfBirth = await _usersClient.GetUserDateOfBirthAsync(childId);
        if (dateOfBirth is { } dob)
        {
            var age = AgeInYears(dob);
            if (age < application.MinAge || age > application.MaxAge)
                return AssignmentOutcome.AgeOutOfRange;
        }

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

    /// <summary>Whole years from <paramref name="dob"/> to today (UTC).</summary>
    private static int AgeInYears(DateTime dob)
    {
        var today = DateTime.UtcNow.Date;
        var age = today.Year - dob.Year;
        if (dob.Date > today.AddYears(-age)) age--;
        return age;
    }
}
