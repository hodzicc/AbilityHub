using AbilityHub.Usage.Controllers.DTOs;

namespace AbilityHub.Usage.Services;

public interface ICheckInService
{
    /// <summary>Creates or updates the check-in for the request's (child, week).</summary>
    Task<WeeklyCheckInResponse> SubmitAsync(Guid childId, WeeklyCheckInRequest request);

    /// <summary>All of a child's check-ins, most recent week first.</summary>
    Task<IReadOnlyList<WeeklyCheckInResponse>> GetForChildAsync(Guid childId);
}
