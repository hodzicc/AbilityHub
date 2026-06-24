using AbilityHub.Settings;
using AbilityHub.Settings.Mapping;
using AbilityHub.Settings.Repositories;
using AbilityHub.Settings.Services;
using AutoMapper;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace AbilityHub.Tests;

/// <summary>
/// Verifies UI-preference resolution: a child has global defaults, and each app may
/// override individual keys. What an app fetches at login (ResolveAsync) must be the
/// global set with the per-app overrides layered on top — global where there is no
/// override, app value where there is one.
/// </summary>
public class PreferenceResolutionTests
{
    private static SettingsService BuildService(out IPreferenceRepository prefs)
    {
        var options = new DbContextOptionsBuilder<SettingsDbContext>()
            .UseInMemoryDatabase($"settings-{Guid.NewGuid()}")
            .Options;
        var db = new SettingsDbContext(options);

        prefs = new PreferenceRepository(db);
        var restrictions = new RestrictionRepository(db);
        var mapper = new MapperConfiguration(
            cfg => cfg.AddProfile<SettingsMappingProfile>(), NullLoggerFactory.Instance).CreateMapper();
        var publish = new Mock<IPublishEndpoint>().Object; // ResolveAsync never publishes
        return new SettingsService(prefs, restrictions, publish, mapper);
    }

    [Fact]
    public async Task Per_app_override_wins_over_global_default_for_that_key_only()
    {
        var childId = Guid.NewGuid();
        var appId = Guid.NewGuid();
        var service = BuildService(out var prefs);

        // Global defaults for the child.
        await prefs.UpsertManyAsync(childId, applicationId: null, new Dictionary<string, string>
        {
            ["fontSize"] = "large",
            ["colorScheme"] = "default",
            ["highContrast"] = "false",
        });
        // One app overrides only the colour scheme.
        await prefs.UpsertManyAsync(childId, appId, new Dictionary<string, string>
        {
            ["colorScheme"] = "high-contrast",
        });

        var resolved = await service.ResolveAsync(childId, appId);

        Assert.Equal("large", resolved.Preferences["fontSize"]);        // from global
        Assert.Equal("high-contrast", resolved.Preferences["colorScheme"]); // overridden
        Assert.Equal("false", resolved.Preferences["highContrast"]);    // from global
    }

    [Fact]
    public async Task App_with_no_override_resolves_to_the_global_defaults()
    {
        var childId = Guid.NewGuid();
        var overriddenApp = Guid.NewGuid();
        var plainApp = Guid.NewGuid();
        var service = BuildService(out var prefs);

        await prefs.UpsertManyAsync(childId, applicationId: null, new Dictionary<string, string>
        {
            ["fontFamily"] = "legible",
            ["colorScheme"] = "default",
        });
        await prefs.UpsertManyAsync(childId, overriddenApp, new Dictionary<string, string>
        {
            ["colorScheme"] = "warm",
        });

        // The app that has no overrides sees the pure global defaults.
        var resolved = await service.ResolveAsync(childId, plainApp);

        Assert.Equal("legible", resolved.Preferences["fontFamily"]);
        Assert.Equal("default", resolved.Preferences["colorScheme"]);
    }
}
