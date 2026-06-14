using AbilityHub.AppRegistry.Controllers.DTOs;

namespace AbilityHub.AppRegistry.Services;

public enum AssignmentOutcome { Assigned, AlreadyAssigned, AppNotFound, AppInactive }

public interface IChildAppService
{
    Task<IReadOnlyList<ChildApplicationResponse>> GetForChildAsync(Guid childId);
    Task<AssignmentOutcome> AssignAsync(Guid childId, Guid applicationId, Guid guardianId);
    Task<bool> RemoveAsync(Guid childId, Guid applicationId);
}
