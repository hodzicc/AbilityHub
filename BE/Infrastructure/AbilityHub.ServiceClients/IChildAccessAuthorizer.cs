using System.Security.Claims;

namespace AbilityHub.ServiceClients;

/// <summary>
/// Centralizes the "who may touch this child's data" decision that every
/// child-scoped endpoint across the platform (settings, usage, check-ins,
/// app assignments, pairing) would otherwise re-implement. Backed by the
/// guardian↔child graph owned by the Users service via
/// <see cref="IUsersServiceClient"/>.
/// </summary>
public interface IChildAccessAuthorizer
{
    /// <summary>
    /// True when the caller may <b>manage</b> a child's data: an admin, or the
    /// child's own guardian (Parent role plus a guardian link). The child
    /// themselves is intentionally not a manager of their own configuration.
    /// </summary>
    Task<bool> CanManageChildAsync(ClaimsPrincipal user, Guid childId);

    /// <summary>
    /// True when the caller may <b>view</b> a child's data: the child themselves,
    /// or anyone allowed by <see cref="CanManageChildAsync"/>.
    /// </summary>
    Task<bool> CanViewChildAsync(ClaimsPrincipal user, Guid childId);
}
