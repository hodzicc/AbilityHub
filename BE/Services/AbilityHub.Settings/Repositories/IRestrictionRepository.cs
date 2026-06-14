using AbilityHub.Settings.Entities;

namespace AbilityHub.Settings.Repositories
{
    public interface IRestrictionRepository
    {
        Task<AppRestriction?> GetAsync(Guid childId, Guid applicationId);
        Task UpsertAsync(AppRestriction restriction);
        Task EnsureExistsAsync(Guid childId, Guid applicationId);
        Task DeleteAsync(Guid childId, Guid applicationId);
    }
}
