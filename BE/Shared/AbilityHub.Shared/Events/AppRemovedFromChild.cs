namespace AbilityHub.Shared.Events;

/// <summary>
/// Published by AppRegistry when a guardian removes an application from a child.
/// Other services react by cleaning up their data for that child/app pairing.
/// </summary>
public record AppRemovedFromChild(
    Guid ChildId,
    Guid ApplicationId) : IntegrationEvent;
