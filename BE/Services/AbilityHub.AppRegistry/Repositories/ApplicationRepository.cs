using Microsoft.EntityFrameworkCore;
using AbilityHub.AppRegistry.Entities;

namespace AbilityHub.AppRegistry.Repositories
{
    public class ApplicationRepository(AppRegistryDbContext context) : IApplicationRepository
    {
        private readonly AppRegistryDbContext _context = context;

        public async Task<Application?> GetByIdAsync(Guid id)
            => await _context.Applications.FirstOrDefaultAsync(a => a.Id == id);

        public async Task<bool> ExistsByKeyAsync(string key)
            => await _context.Applications.AnyAsync(a => a.Key == key);

        public async Task<IReadOnlyList<Application>> GetAllAsync(bool includeInactive)
        {
            var query = _context.Applications.AsNoTracking();
            if (!includeInactive)
                query = query.Where(a => a.IsActive);

            return await query.OrderBy(a => a.Name).ToListAsync();
        }

        public async Task AddAsync(Application application)
        {
            await _context.Applications.AddAsync(application);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Application application)
        {
            _context.Applications.Update(application);
            await _context.SaveChangesAsync();
        }
    }
}
