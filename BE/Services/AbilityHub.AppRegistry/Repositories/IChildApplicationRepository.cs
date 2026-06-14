using AbilityHub.AppRegistry.Entities;

namespace AbilityHub.AppRegistry.Repositories
{
    public interface IChildApplicationRepository
    {
        Task<IReadOnlyList<ChildApplication>> GetForChildAsync(Guid childId);
        Task<bool> ExistsAsync(Guid childId, Guid applicationId);
        Task AddAsync(ChildApplication assignment);
        Task<bool> RemoveAsync(Guid childId, Guid applicationId);
    }
}
