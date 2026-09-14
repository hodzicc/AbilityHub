using AbilityHub.Usage.Entities;

namespace AbilityHub.Usage.Repositories
{
    public interface ICheckInRepository
    {
        /// <summary>The check-in for a (child, week), or null if none exists yet.</summary>
        Task<WeeklyCheckIn?> GetByWeekAsync(Guid childId, DateOnly weekStartDate);

        /// <summary>A single check-in by id, or null if not found.</summary>
        Task<WeeklyCheckIn?> GetByIdAsync(Guid id);

        /// <summary>All of a child's check-ins, most recent week first.</summary>
        Task<IReadOnlyList<WeeklyCheckIn>> GetForChildAsync(Guid childId);

        /// <summary>Of the given children, the ids that already have a check-in for the
        /// given week — lets the caller tell which are still missing one in a single query.</summary>
        Task<IReadOnlyList<Guid>> GetChildIdsWithCheckInForWeekAsync(IReadOnlyCollection<Guid> childIds, DateOnly weekStartDate);

        Task AddAsync(WeeklyCheckIn checkIn);
        Task UpdateAsync(WeeklyCheckIn checkIn);
        Task DeleteAsync(WeeklyCheckIn checkIn);
    }
}
