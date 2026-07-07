namespace AbilityHub.Usage;

using AbilityHub.Usage.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

public class UsageDbContext(DbContextOptions<UsageDbContext> options) : DbContext(options)
{
    public DbSet<UsageSession> UsageSessions { get; set; }
    public DbSet<ActivityRecord> ActivityRecords { get; set; }
    public DbSet<WeeklyCheckIn> WeeklyCheckIns { get; set; }

    // SQL Server's datetime2 doesn't persist DateTimeKind, so every value comes back
    // Unspecified even though every timestamp we write is DateTime.UtcNow. Left as-is,
    // System.Text.Json serializes those without a "Z" suffix and the frontend's
    // `new Date(...)` then parses them as local time instead of UTC, effectively
    // displaying the raw UTC clock as if it were local. Tagging every DateTime read
    // from the DB as Utc fixes serialization for all timestamp fields at once.
    private static readonly ValueConverter<DateTime, DateTime> UtcDateTimeConverter = new(
        toDb => toDb,
        fromDb => DateTime.SpecifyKind(fromDb, DateTimeKind.Utc));

    private static readonly ValueConverter<DateTime?, DateTime?> UtcNullableDateTimeConverter = new(
        toDb => toDb,
        fromDb => fromDb.HasValue ? DateTime.SpecifyKind(fromDb.Value, DateTimeKind.Utc) : fromDb);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UsageSession>()
            .HasIndex(s => new { s.ChildId, s.ApplicationId, s.StartedAt });

        modelBuilder.Entity<ActivityRecord>()
            .HasIndex(a => new { a.ChildId, a.ApplicationId, a.OccurredAt });

        // One parent evaluation per child per week.
        modelBuilder.Entity<WeeklyCheckIn>()
            .HasIndex(c => new { c.ChildId, c.WeekStartDate })
            .IsUnique();

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                    property.SetValueConverter(UtcDateTimeConverter);
                else if (property.ClrType == typeof(DateTime?))
                    property.SetValueConverter(UtcNullableDateTimeConverter);
            }
        }
    }
}
