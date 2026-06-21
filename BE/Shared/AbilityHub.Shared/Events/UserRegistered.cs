namespace AbilityHub.Shared.Events;

/// <summary>
/// Integration event published by the Auth service when a new user (credential)
/// is created. Consumed by other services (e.g. Users) to build their own
/// view of the user. Carries no secrets — the password never leaves Auth.
/// <para>
/// <see cref="GuardianId"/> is set when a parent creates a child account, so the
/// Users service can establish the guardian↔child link in one step.
/// </para>
/// </summary>
public record UserRegistered(
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    int RoleId,
    Guid? GuardianId = null,
    DateTime? DateOfBirth = null,
    string? Gender = null) : IntegrationEvent;
