using Microsoft.EntityFrameworkCore;
using AbilityHub.Shared.Common;
using AbilityHub.Users.Entities;

namespace AbilityHub.Users.Repositories
{
    public class UserRepository(UsersDbContext context) : IUserRepository
    {
        private readonly UsersDbContext _context = context;

        public async Task<User?> GetByIdAsync(Guid id)
            => await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

        public async Task<(IReadOnlyList<User> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, string? search = null, int? roleId = null, bool includeInactive = false)
        {
            var query = _context.Users.AsNoTracking().AsQueryable();

            // Active users only by default; deactivated accounts are surfaced only when a
            // caller explicitly asks (the admin management view, so it can reactivate them).
            if (!includeInactive)
                query = query.Where(u => u.IsActive);

            if (roleId is not null)
                query = query.Where(u => u.RoleId == roleId);

            if (!string.IsNullOrWhiteSpace(search))
            {
                // EF translates this to a case-insensitive LIKE on SQL Server's default
                // collation — matches the frontend's client-side name/email filter it replaces.
                query = query.Where(u =>
                    EF.Functions.Like(u.FirstName, $"%{search}%") ||
                    EF.Functions.Like(u.LastName, $"%{search}%") ||
                    EF.Functions.Like(u.Email, $"%{search}%"));
            }

            query = query.OrderBy(u => u.LastName).ThenBy(u => u.FirstName);

            var total = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, total);
        }

        public async Task<RoleCounts> GetRoleCountsAsync()
        {
            var counts = await _context.Users
                .AsNoTracking()
                .GroupBy(u => u.RoleId)
                .Select(g => new { RoleId = g.Key, Count = g.Count() })
                .ToListAsync();

            return new RoleCounts(
                Total: counts.Sum(c => c.Count),
                Admins: counts.FirstOrDefault(c => c.RoleId == Roles.AdminId)?.Count ?? 0,
                Parents: counts.FirstOrDefault(c => c.RoleId == Roles.ParentId)?.Count ?? 0,
                Children: counts.FirstOrDefault(c => c.RoleId == Roles.ChildId)?.Count ?? 0);
        }

        public async Task<Dictionary<Guid, int>> GetChildCountsByGuardianAsync()
            => await _context.GuardianChildren
                .AsNoTracking()
                .GroupBy(gc => gc.GuardianId)
                .Select(g => new { GuardianId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.GuardianId, g => g.Count);

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
                .Where(u => u.IsActive) // hide deactivated (deleted) children
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
