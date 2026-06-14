using AbilityHub.Auth.Entities;

namespace AbilityHub.Auth.Repositories.Interfaces
{
    public interface IAuthRepository
    {
        Task<RefreshToken?> GetByTokenAsync(string token);
        Task AddAsync(RefreshToken token);
        Task UpdateAsync(RefreshToken token);

        /// <summary>Revokes every active refresh token belonging to a user (e.g. on deactivation).</summary>
        Task RevokeAllForUserAsync(Guid userId);
    }
}
