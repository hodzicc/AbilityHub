using AbilityHub.Usage.Entities;

namespace AbilityHub.Usage.Repositories
{
    public interface ICheckInRepository
    {
        /// <summary>The check-in for a (child, week), or null if none exists yet.</summary>
        Task<WeeklyCheckIn?> GetByWeekAsync(Guid childId, DateOnly weekStartDate);

        /// <summary>All of a child's check-ins, most recent week first.</summary>
        Task<IReadOnlyList<WeeklyCheckIn>> GetForChildAsync(Guid childId);

        Task AddAsync(WeeklyCheckIn checkIn);
        Task UpdateAsync(WeeklyCheckIn checkIn);
    }
}
