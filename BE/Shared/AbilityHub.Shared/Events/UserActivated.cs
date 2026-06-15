namespace AbilityHub.Shared.Events;

/// <summary>
/// Published by the Auth service when a previously deactivated user account
/// is reactivated (admin action). Other services react by re-enabling their
/// own view of the user.
/// </summary>
public record UserActivated(Guid UserId) : IntegrationEvent;
