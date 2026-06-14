using Microsoft.EntityFrameworkCore;
using AbilityHub.AppRegistry.Entities;

namespace AbilityHub.AppRegistry.Repositories
{
    public class ChildApplicationRepository(AppRegistryDbContext context) : IChildApplicationRepository
    {
        private readonly AppRegistryDbContext _context = context;

        public async Task<IReadOnlyList<ChildApplication>> GetForChildAsync(Guid childId)
            => await _context.ChildApplications
                .Include(ca => ca.Application)
                .Where(ca => ca.ChildId == childId)
                .AsNoTracking()
                .ToListAsync();

        public async Task<bool> ExistsAsync(Guid childId, Guid applicationId)
            => await _context.ChildApplications
                .AnyAsync(ca => ca.ChildId == childId && ca.ApplicationId == applicationId);

        public async Task AddAsync(ChildApplication assignment)
        {
            await _context.ChildApplications.AddAsync(assignment);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> RemoveAsync(Guid childId, Guid applicationId)
        {
            var assignment = await _context.ChildApplications
                .FirstOrDefaultAsync(ca => ca.ChildId == childId && ca.ApplicationId == applicationId);

            if (assignment is null)
                return false;

            _context.ChildApplications.Remove(assignment);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
