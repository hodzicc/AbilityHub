using AbilityHub.AppRegistry.Entities;

namespace AbilityHub.AppRegistry.Repositories
{
    public interface IApplicationRepository
    {
        Task<Application?> GetByIdAsync(Guid id);
        Task<bool> ExistsByKeyAsync(string key);
        Task<IReadOnlyList<Application>> GetAllAsync(bool includeInactive);
        Task AddAsync(Application application);
        Task UpdateAsync(Application application);
    }
}
