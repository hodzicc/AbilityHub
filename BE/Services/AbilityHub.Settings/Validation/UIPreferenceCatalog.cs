namespace AbilityHub.Settings.Validation;

/// <summary>
/// Allow-lists for the platform-defined UI preference keys, mirroring the
/// FontSize/ColorScheme/FontFamily unions in FE/lib/types/index.ts and the
/// option lists in FE/lib/preferences.ts. Preferences are still stored as a
/// generic key/value bag (see Entities/Preference.cs) so apps can keep
/// defining their own keys — this only validates the handful of values the
/// platform itself understands and surfaces in its preferences UI, so a typo
/// or invalid choice (e.g. an unknown font) is rejected instead of silently
/// persisted and ignored by every client.
/// </summary>
public static class UIPreferenceCatalog
{
    public const string FontSizeKey = "fontSize";
    public const string ColorSchemeKey = "colorScheme";
    public const string FontFamilyKey = "fontFamily";
    public const string ReducedMotionKey = "reducedMotion";
    public const string HighContrastKey = "highContrast";
    public const string SoundEnabledKey = "soundEnabled";

    public static readonly IReadOnlySet<string> FontSizes =
        new HashSet<string>(StringComparer.Ordinal) { "small", "medium", "large", "extra-large" };

    public static readonly IReadOnlySet<string> ColorSchemes =
        new HashSet<string>(StringComparer.Ordinal) { "default", "high-contrast", "pastel", "warm" };

    public static readonly IReadOnlySet<string> FontFamilies =
        new HashSet<string>(StringComparer.Ordinal) { "default", "rounded", "legible" };

    private static readonly IReadOnlySet<string> BooleanValues =
        new HashSet<string>(StringComparer.Ordinal) { "true", "false" };

    private static readonly Dictionary<string, IReadOnlySet<string>> KnownKeys = new()
    {
        [FontSizeKey] = FontSizes,
        [ColorSchemeKey] = ColorSchemes,
        [FontFamilyKey] = FontFamilies,
        [ReducedMotionKey] = BooleanValues,
        [HighContrastKey] = BooleanValues,
        [SoundEnabledKey] = BooleanValues,
    };

    /// <summary>
    /// Validates only the platform-known keys present in <paramref name="values"/>.
    /// Unknown keys are left untouched — they belong to whatever app defined them.
    /// Returns a description per invalid entry; an empty list means the request is valid.
    /// </summary>
    public static IReadOnlyList<string> Validate(IReadOnlyDictionary<string, string> values)
    {
        var errors = new List<string>();
        foreach (var (key, value) in values)
        {
            if (KnownKeys.TryGetValue(key, out var allowed) && !allowed.Contains(value))
            {
                errors.Add($"'{value}' is not a valid value for '{key}'. Allowed: {string.Join(", ", allowed)}.");
            }
        }
        return errors;
    }
}
