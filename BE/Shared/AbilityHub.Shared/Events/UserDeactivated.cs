namespace AbilityHub.Shared.Events;

/// <summary>
/// Published by the Auth service when a user account is deactivated (admin
/// action). Other services react by disabling their own view of the user.
/// </summary>
public record UserDeactivated(Guid UserId) : IntegrationEvent;
