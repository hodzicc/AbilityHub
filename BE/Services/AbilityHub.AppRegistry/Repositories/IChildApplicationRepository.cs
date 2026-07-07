using AbilityHub.AppRegistry.Entities;

namespace AbilityHub.AppRegistry.Repositories
{
    public interface IChildApplicationRepository
    {
        Task<IReadOnlyList<ChildApplication>> GetForChildAsync(Guid childId);

        /// <summary>Every child assignment of a given app, across all children — one
        /// query instead of the caller checking each child's own assignment list.</summary>
        Task<IReadOnlyList<ChildApplication>> GetForApplicationAsync(Guid applicationId);
        Task<bool> ExistsAsync(Guid childId, Guid applicationId);
        Task AddAsync(ChildApplication assignment);
        Task<bool> RemoveAsync(Guid childId, Guid applicationId);
    }
}
