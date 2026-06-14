using AbilityHub.Auth.Entities;

namespace AbilityHub.Auth.Repositories.Interfaces
{
    public interface ICredentialRepository
    {
        Task<Credential?> GetByIdAsync(Guid id);
        Task<Credential?> GetByEmailAsync(string email);
        Task<bool> ExistsByEmailAsync(string email);
        Task AddAsync(Credential credential);
        Task UpdateAsync(Credential credential);
    }
}
