using AbilityHub.Auth.Controllers.DTOs;

namespace AbilityHub.Auth.Services.Interfaces
{
    public interface IUserService
    {
        /// <param name="guardianId">Resolved guardian to link (caller for parents, request value for admins).</param>
        Task<CreateUserResponse> CreateUserAsync(CreateUserRequest request, Guid? guardianId);

        /// <summary>Deactivates an account: blocks login, revokes tokens, announces UserDeactivated.</summary>
        Task<bool> DeactivateUserAsync(Guid userId);

        /// <summary>Reactivates a previously deactivated account and announces UserActivated.</summary>
        Task<bool> ActivateUserAsync(Guid userId);
    }
}
