using AbilityHub.Settings.Entities;

namespace AbilityHub.Settings.Repositories
{
    public interface IPreferenceRepository
    {
        /// <param name="applicationId">null = global defaults; a value = per-app overrides.</param>
        Task<IReadOnlyList<Preference>> GetAsync(Guid childId, Guid? applicationId);
        Task UpsertManyAsync(Guid childId, Guid? applicationId, IReadOnlyDictionary<string, string> values);
        Task DeleteForAppAsync(Guid childId, Guid applicationId);
    }
}
