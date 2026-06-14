// Data/AuthDbContext.cs
namespace AbilityHub.Auth;

using AbilityHub.Auth.Entities;
using Microsoft.EntityFrameworkCore;

public class AuthDbContext(DbContextOptions<AuthDbContext> options) : DbContext(options)
{
    public DbSet<Credential> Credentials { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Credential>()
            .HasIndex(c => c.Email)
            .IsUnique();

        modelBuilder.Entity<Credential>()
            .HasOne(c => c.Role)
            .WithMany(r => r.Credentials)
            .HasForeignKey(c => c.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RefreshToken>();
    }
}
