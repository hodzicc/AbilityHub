namespace AbilityHub.Users.Controllers.DTOs;

/// <summary>
/// Platform-wide user directory summary for the admin dashboard: role counts and
/// per-guardian child counts, both computed across every row in one query each —
/// not by the caller paging through the whole directory or looping per guardian.
/// </summary>
public class UserSummaryResponse
{
    public int TotalUsers { get; set; }
    public int AdminCount { get; set; }
    public int ParentCount { get; set; }
    public int ChildCount { get; set; }

    /// <summary>Guardian id → number of linked children.</summary>
    public Dictionary<Guid, int> ChildCountsByGuardian { get; set; } = new();
}
