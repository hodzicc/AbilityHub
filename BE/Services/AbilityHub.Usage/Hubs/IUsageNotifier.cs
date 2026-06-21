namespace AbilityHub.Usage.Hubs;

/// <summary>Pushes a content-free "usage changed" signal for a child to its subscribers.</summary>
public interface IUsageNotifier
{
    Task NotifyUsageChangedAsync(Guid childId);
}
