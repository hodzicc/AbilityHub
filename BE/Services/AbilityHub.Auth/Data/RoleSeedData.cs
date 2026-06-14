using AbilityHub.Auth.Entities;
using Microsoft.EntityFrameworkCore;

namespace AbilityHub.Auth.Data
{
    public static class RoleSeedData
    {
        public static async Task InitializeAsync(AuthDbContext db)
        {
            if (await db.Roles.AnyAsync())
                return;

            await db.Roles.AddRangeAsync(
                new Role { Name = "Admin" },
                new Role { Name = "Parent" },
                new Role { Name = "Child" }
            );

            await db.SaveChangesAsync();
        }
    }
}
