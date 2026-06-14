using Microsoft.EntityFrameworkCore;
using AbilityHub.Settings.Entities;

namespace AbilityHub.Settings.Repositories
{
    public class PreferenceRepository(SettingsDbContext context) : IPreferenceRepository
    {
        private readonly SettingsDbContext _context = context;

        public async Task<IReadOnlyList<Preference>> GetAsync(Guid childId, Guid? applicationId)
            => await _context.Preferences
                .Where(p => p.ChildId == childId && p.ApplicationId == applicationId)
                .AsNoTracking()
                .ToListAsync();

        public async Task UpsertManyAsync(Guid childId, Guid? applicationId, IReadOnlyDictionary<string, string> values)
        {
            var existing = await _context.Preferences
                .Where(p => p.ChildId == childId && p.ApplicationId == applicationId)
                .ToListAsync();

            foreach (var (key, value) in values)
            {
                var current = existing.FirstOrDefault(p => p.Key == key);
                if (current is null)
                {
                    _context.Preferences.Add(new Preference
                    {
                        Id = Guid.NewGuid(),
                        ChildId = childId,
                        ApplicationId = applicationId,
                        Key = key,
                        Value = value,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
                else
                {
                    current.Value = value;
                    current.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task DeleteForAppAsync(Guid childId, Guid applicationId)
        {
            await _context.Preferences
                .Where(p => p.ChildId == childId && p.ApplicationId == applicationId)
                .ExecuteDeleteAsync();
        }
    }
}
