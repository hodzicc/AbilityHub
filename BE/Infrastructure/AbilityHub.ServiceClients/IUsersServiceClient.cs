namespace AbilityHub.ServiceClients;

/// <summary>
/// Talks to the Users service to answer relationship questions other services
/// can't answer locally (the guardian↔child graph is owned by Users). A
/// deliberate synchronous integration point — see docs/integration-notes.md.
/// </summary>
public interface IUsersServiceClient
{
    Task<bool> IsGuardianOfChildAsync(Guid guardianId, Guid childId);

    /// <summary>
    /// The user's date of birth, or null if unknown/unavailable. Used by other
    /// services that need the child's age (e.g. app age-range checks).
    /// </summary>
    Task<DateTime?> GetUserDateOfBirthAsync(Guid userId);
}
