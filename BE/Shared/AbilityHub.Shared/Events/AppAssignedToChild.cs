namespace AbilityHub.Shared.Events;

/// <summary>
/// Published by AppRegistry when a guardian assigns an application to a child.
/// Other services react: Settings can seed default per-app preferences, Usage
/// can start tracking that app for the child.
/// </summary>
public record AppAssignedToChild(
    Guid ChildId,
    Guid ApplicationId,
    string ApplicationKey,
    Guid AssignedByGuardianId) : IntegrationEvent;
