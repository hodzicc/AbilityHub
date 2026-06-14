namespace AbilityHub.Shared.Events;

/// <summary>
/// Published by the Settings service when a child's preferences or app
/// restrictions change. Mobile apps (or a push layer) can react by re-fetching
/// resolved settings. <see cref="ApplicationId"/> is null for global changes.
/// </summary>
public record PreferencesUpdated(
    Guid ChildId,
    Guid? ApplicationId) : IntegrationEvent;
