namespace AbilityHub.Shared.Events;

/// <summary>
/// Marker + metadata contract for every cross-service integration event.
/// Gives all events a stable identity and timestamp for tracing, idempotency
/// and ordering diagnostics.
/// </summary>
public interface IIntegrationEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
}

/// <summary>Base record that stamps each event with an id and UTC timestamp.</summary>
public abstract record IntegrationEvent : IIntegrationEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime OccurredAt { get; init; } = DateTime.UtcNow;
}
