using AbilityHub.Users.Entities;

namespace AbilityHub.Users.Repositories
{
    public record RoleCounts(int Total, int Admins, int Parents, int Children);

    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(Guid id);

        /// <summary>Optionally filtered by role and/or a case-insensitive substring match
        /// on first/last name or email — the directory search is done server-side rather
        /// than the caller loading a page and filtering it client-side.</summary>
        /// <summary>Paged user directory. Returns active users only unless
        /// <paramref name="includeInactive"/> is set (the admin management view).</summary>
        Task<(IReadOnlyList<User> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, string? search = null, int? roleId = null, bool includeInactive = false);

        /// <summary>User counts by role across the whole directory — computed once on
        /// the backend so the admin dashboard's summary cards stay correct regardless
        /// of how many users exist, instead of counting whatever page happens to be loaded.</summary>
        Task<RoleCounts> GetRoleCountsAsync();

        /// <summary>Number of linked children per guardian, across every guardian —
        /// one aggregate query instead of the caller looping GetChildrenAsync per parent.</summary>
        Task<Dictionary<Guid, int>> GetChildCountsByGuardianAsync();

        Task<bool> ExistsAsync(Guid id);
        Task AddAsync(User user);
        Task UpdateAsync(User user);

        // Guardian ↔ child relationships
        /// <summary>A guardian's active children. Deactivated (deleted) children are
        /// excluded — they no longer appear in the parent's list, and since this also
        /// backs the guardian-access check, a deleted child stops being manageable.</summary>
        Task<IReadOnlyList<User>> GetChildrenAsync(Guid guardianId);
        Task<bool> IsGuardianOfAsync(Guid guardianId, Guid childId);
        Task<bool> LinkExistsAsync(Guid guardianId, Guid childId);
        Task AddLinkAsync(GuardianChild link);
        Task<bool> RemoveLinkAsync(Guid guardianId, Guid childId);
    }
}
