namespace AbilityHub.Settings.Hubs;

/// <summary>Pushes a "settings changed" signal to a child's connected clients.</summary>
public interface ISettingsNotifier
{
    /// <param name="type">"restriction" or "preferences".</param>
    /// <param name="applicationId">The app affected, or null for global preferences.</param>
    Task NotifyChildAsync(Guid childId, string type, Guid? applicationId);
}
