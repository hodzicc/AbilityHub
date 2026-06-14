namespace AbilityHub.AppRegistry;

using AbilityHub.AppRegistry.Entities;
using Microsoft.EntityFrameworkCore;

public class AppRegistryDbContext(DbContextOptions<AppRegistryDbContext> options) : DbContext(options)
{
    public DbSet<Application> Applications { get; set; }
    public DbSet<ChildApplication> ChildApplications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Application>()
            .HasIndex(a => a.Key)
            .IsUnique();

        modelBuilder.Entity<ChildApplication>(entity =>
        {
            entity.HasKey(ca => new { ca.ChildId, ca.ApplicationId });

            entity.HasOne(ca => ca.Application)
                .WithMany()
                .HasForeignKey(ca => ca.ApplicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
