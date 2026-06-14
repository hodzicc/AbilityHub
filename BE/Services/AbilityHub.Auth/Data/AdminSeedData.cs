using AbilityHub.Auth.Entities;
using AbilityHub.Auth.Security;
using Microsoft.EntityFrameworkCore;

namespace AbilityHub.Auth.Data
{
    /// <summary>
    /// Seeds a single bootstrap Admin credential so the system is usable before
    /// any user exists (creating users requires the Admin role). The password is
    /// taken from configuration (<c>Seed:AdminPassword</c>) and should be set via
    /// environment / user-secrets rather than committed.
    /// </summary>
    public static class AdminSeedData
    {
        public const string AdminEmail = "admin@abilityhub.local";

        public static async Task InitializeAsync(AuthDbContext db, IPasswordHasher passwordHasher, IConfiguration config)
        {
            if (await db.Credentials.AnyAsync(c => c.Email == AdminEmail))
                return;

            var adminRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
            if (adminRole is null)
                return; // roles not seeded yet

            var password = config["Seed:AdminPassword"] ?? "ChangeMe123!";

            db.Credentials.Add(new Credential
            {
                Id = Guid.NewGuid(),
                Email = AdminEmail,
                PasswordHash = passwordHasher.Hash(password),
                RoleId = adminRole.Id
            });

            await db.SaveChangesAsync();
        }
    }
}
