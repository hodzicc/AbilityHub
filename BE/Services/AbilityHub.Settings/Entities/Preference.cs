using System.ComponentModel.DataAnnotations.Schema;

namespace AbilityHub.Settings.Entities;

/// <summary>
/// A single preference value (e.g. "primaryColor" = "#0066CC", "fontFamily" =
/// "OpenDyslexic"). Free-form key/value so the platform doesn't hardcode the UI
/// vocabulary — apps interpret the keys they understand.
/// <para>
/// <see cref="ApplicationId"/> null = the child's global default; a value = a
/// per-app override that wins over the global default during resolution.
/// </para>
/// </summary>
[Table("Preferences")]
public class Preference
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public Guid? ApplicationId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}
