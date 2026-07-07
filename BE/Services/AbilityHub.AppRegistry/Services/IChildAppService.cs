using AbilityHub.AppRegistry.Controllers.DTOs;

namespace AbilityHub.AppRegistry.Services;

public enum AssignmentOutcome { Assigned, AlreadyAssigned, AppNotFound, AppInactive, AgeOutOfRange }

public interface IChildAppService
{
    Task<IReadOnlyList<ChildApplicationResponse>> GetForChildAsync(Guid childId);

    /// <summary>Every child assignment of a given app, across all children.</summary>
    Task<IReadOnlyList<AppAssignmentResponse>> GetAssignedChildrenAsync(Guid applicationId);
    Task<AssignmentOutcome> AssignAsync(Guid childId, Guid applicationId, Guid guardianId);
    Task<bool> RemoveAsync(Guid childId, Guid applicationId);
}
