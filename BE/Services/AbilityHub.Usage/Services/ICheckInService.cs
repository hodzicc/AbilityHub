using AbilityHub.Usage.Controllers.DTOs;

namespace AbilityHub.Usage.Services;

public interface ICheckInService
{
    /// <summary>Creates or updates the check-in for the request's (child, week).</summary>
    Task<WeeklyCheckInResponse> SubmitAsync(Guid childId, WeeklyCheckInRequest request);

    /// <summary>All of a child's check-ins, most recent week first.</summary>
    Task<IReadOnlyList<WeeklyCheckInResponse>> GetForChildAsync(Guid childId);

    /// <summary>Of the given children, those with no check-in yet for <paramref name="weekStart"/>
    /// — so a guardian's dashboard can list who still needs one in a single call.</summary>
    Task<IReadOnlyList<Guid>> GetChildrenMissingCheckInAsync(IReadOnlyCollection<Guid> childIds, DateOnly weekStart);

    /// <summary>Deletes the check-in if it exists and belongs to <paramref name="childId"/>.
    /// Returns false if not found or owned by a different child.</summary>
    Task<bool> DeleteAsync(Guid childId, Guid checkInId);
}
