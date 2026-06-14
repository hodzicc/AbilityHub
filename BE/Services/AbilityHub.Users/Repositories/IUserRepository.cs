using AbilityHub.Users.Entities;

namespace AbilityHub.Users.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(Guid id);
        Task<(IReadOnlyList<User> Items, int TotalCount)> GetPagedAsync(int page, int pageSize);
        Task<bool> ExistsAsync(Guid id);
        Task AddAsync(User user);
        Task UpdateAsync(User user);

        // Guardian ↔ child relationships
        Task<IReadOnlyList<User>> GetChildrenAsync(Guid guardianId);
        Task<bool> IsGuardianOfAsync(Guid guardianId, Guid childId);
        Task<bool> LinkExistsAsync(Guid guardianId, Guid childId);
        Task AddLinkAsync(GuardianChild link);
        Task<bool> RemoveLinkAsync(Guid guardianId, Guid childId);
    }
}
