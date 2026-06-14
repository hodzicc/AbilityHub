using System.ComponentModel.DataAnnotations.Schema;
using AbilityHub.Shared.Interfaces;

namespace AbilityHub.AppRegistry.Entities;

/// <summary>
/// A catalog entry for an application that can be integrated into the platform.
/// <see cref="DataFormat"/> declares the standardized format the app speaks
/// (e.g. usage/progress schema version) — this is the documented integration point.
/// </summary>
[Table("Applications")]
public class Application : IAuditable
{
    public Guid Id { get; set; }

    /// <summary>Stable slug used by apps/integrations, e.g. "memory-game". Unique.</summary>
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    /// <summary>"Mobile", "Web", or "Both".</summary>
    public string Platform { get; set; } = "Mobile";
    public string Version { get; set; } = string.Empty;

    /// <summary>Identifier of the data/contract format the app exchanges, e.g. "abilityhub.usage.v1".</summary>
    public string DataFormat { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    /// <summary>Whether the app is available to be assigned to children.</summary>
    public bool IsActive { get; set; } = true;

    public Guid CreateUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? UpdateUserId { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
