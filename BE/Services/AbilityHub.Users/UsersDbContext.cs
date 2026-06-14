namespace AbilityHub.Users;

using AbilityHub.Users.Entities;
using Microsoft.EntityFrameworkCore;

public class UsersDbContext(DbContextOptions<UsersDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<GuardianChild> GuardianChildren { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<GuardianChild>(entity =>
        {
            entity.HasKey(gc => new { gc.GuardianId, gc.ChildId });

            entity.HasOne(gc => gc.Guardian)
                .WithMany()
                .HasForeignKey(gc => gc.GuardianId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(gc => gc.Child)
                .WithMany()
                .HasForeignKey(gc => gc.ChildId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
