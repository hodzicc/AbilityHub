namespace AbilityHub.Settings;

using AbilityHub.Settings.Entities;
using Microsoft.EntityFrameworkCore;

public class SettingsDbContext(DbContextOptions<SettingsDbContext> options) : DbContext(options)
{
    public DbSet<Preference> Preferences { get; set; }
    public DbSet<AppRestriction> AppRestrictions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // One value per (child, scope, key). ApplicationId null = global scope.
        modelBuilder.Entity<Preference>()
            .HasIndex(p => new { p.ChildId, p.ApplicationId, p.Key })
            .IsUnique();

        modelBuilder.Entity<AppRestriction>()
            .HasKey(r => new { r.ChildId, r.ApplicationId });
    }
}
