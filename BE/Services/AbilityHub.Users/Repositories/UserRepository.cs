using Microsoft.EntityFrameworkCore;
using AbilityHub.Users.Entities;

namespace AbilityHub.Users.Repositories
{
    public class UserRepository(UsersDbContext context) : IUserRepository
    {
        private readonly UsersDbContext _context = context;

        public async Task<User?> GetByIdAsync(Guid id)
            => await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

        public async Task<(IReadOnlyList<User> Items, int TotalCount)> GetPagedAsync(int page, int pageSize)
        {
            var query = _context.Users.AsNoTracking()
                .OrderBy(u => u.LastName).ThenBy(u => u.FirstName);

            var total = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, total);
        }

        public async Task<bool> ExistsAsync(Guid id)
            => await _context.Users.AnyAsync(u => u.Id == id);

        public async Task AddAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<User>> GetChildrenAsync(Guid guardianId)
            => await _context.GuardianChildren
                .Where(gc => gc.GuardianId == guardianId)
                .Join(_context.Users, gc => gc.ChildId, u => u.Id, (gc, u) => u)
                .AsNoTracking()
                .OrderBy(u => u.LastName).ThenBy(u => u.FirstName)
                .ToListAsync();

        public async Task<bool> IsGuardianOfAsync(Guid guardianId, Guid childId)
            => await _context.GuardianChildren
                .AnyAsync(gc => gc.GuardianId == guardianId && gc.ChildId == childId);

        public async Task<bool> LinkExistsAsync(Guid guardianId, Guid childId)
            => await _context.GuardianChildren
                .AnyAsync(gc => gc.GuardianId == guardianId && gc.ChildId == childId);

        public async Task AddLinkAsync(GuardianChild link)
        {
            await _context.GuardianChildren.AddAsync(link);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> RemoveLinkAsync(Guid guardianId, Guid childId)
        {
            var link = await _context.GuardianChildren
                .FirstOrDefaultAsync(gc => gc.GuardianId == guardianId && gc.ChildId == childId);

            if (link is null)
                return false;

            _context.GuardianChildren.Remove(link);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
