using Microsoft.EntityFrameworkCore;
using AbilityHub.Usage.Entities;

namespace AbilityHub.Usage.Repositories
{
    public class CheckInRepository(UsageDbContext context) : ICheckInRepository
    {
        private readonly UsageDbContext _context = context;

        public async Task<WeeklyCheckIn?> GetByWeekAsync(Guid childId, DateOnly weekStartDate)
            => await _context.WeeklyCheckIns
                .FirstOrDefaultAsync(c => c.ChildId == childId && c.WeekStartDate == weekStartDate);

        public async Task<IReadOnlyList<WeeklyCheckIn>> GetForChildAsync(Guid childId)
            => await _context.WeeklyCheckIns
                .Where(c => c.ChildId == childId)
                .OrderByDescending(c => c.WeekStartDate)
                .AsNoTracking()
                .ToListAsync();

        public async Task AddAsync(WeeklyCheckIn checkIn)
        {
            await _context.WeeklyCheckIns.AddAsync(checkIn);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(WeeklyCheckIn checkIn)
        {
            _context.WeeklyCheckIns.Update(checkIn);
            await _context.SaveChangesAsync();
        }
    }
}
