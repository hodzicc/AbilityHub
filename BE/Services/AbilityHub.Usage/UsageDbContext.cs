namespace AbilityHub.Usage;

using AbilityHub.Usage.Entities;
using Microsoft.EntityFrameworkCore;

public class UsageDbContext(DbContextOptions<UsageDbContext> options) : DbContext(options)
{
    public DbSet<UsageSession> UsageSessions { get; set; }
    public DbSet<ActivityRecord> ActivityRecords { get; set; }
    public DbSet<WeeklyCheckIn> WeeklyCheckIns { get; set; }

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
    }
}
