using AbilityHub.Auth.Entities;

namespace AbilityHub.Auth.Repositories.Interfaces
{
    public interface IPairingTokenRepository
    {
        Task AddAsync(PairingToken token);

        /// <summary>Looks a token up by its stored hash (the plaintext is never persisted).</summary>
        Task<PairingToken?> GetByHashAsync(string tokenHash);

        Task UpdateAsync(PairingToken token);
    }
}
