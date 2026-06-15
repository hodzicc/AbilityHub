using AbilityHub.Auth.Entities;
using AbilityHub.Auth.Security;
using AbilityHub.Shared.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace AbilityHub.Auth.Data
{
    /// <summary>
    /// Seeds demo users (one parent + two children) for development/testing.
    /// Runs only when the parent credential doesn't already exist.
    /// </summary>
    public static class DemoSeedData
    {
        public const string ParentEmail = "emina@abilityhub.local";

        public static async Task InitializeAsync(
            AuthDbContext db,
            IPasswordHasher passwordHasher,
            IPublishEndpoint publishEndpoint)
        {
            if (await db.Credentials.AnyAsync(c => c.Email == ParentEmail))
                return;

            var parentRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "Parent");
            var childRole  = await db.Roles.FirstOrDefaultAsync(r => r.Name == "Child");
            if (parentRole is null || childRole is null)
                return;

            var parentId = Guid.NewGuid();
            var child1Id = Guid.NewGuid();
            var child2Id = Guid.NewGuid();

            db.Credentials.AddRange(
                new Credential { Id = parentId, Email = ParentEmail,                              PasswordHash = passwordHasher.Hash("Roditelj123!"), RoleId = parentRole.Id },
                new Credential { Id = child1Id, Email = "amar@internal.abilityhub.app",  PasswordHash = passwordHasher.Hash("_seed_unused_"), RoleId = childRole.Id },
                new Credential { Id = child2Id, Email = "lejla@internal.abilityhub.app", PasswordHash = passwordHasher.Hash("_seed_unused_"), RoleId = childRole.Id }
            );

            await db.SaveChangesAsync();

            // Events create profiles in the Users service and establish guardian links.
            await publishEndpoint.Publish(new UserRegistered(parentId, ParentEmail, "Emina", "Hodžić", parentRole.Id));
            await Task.Delay(300); // let the consumer process parent first before children reference it
            await publishEndpoint.Publish(new UserRegistered(child1Id, "amar@internal.abilityhub.app",  "Amar",  "Hodžić", childRole.Id, GuardianId: parentId));
            await publishEndpoint.Publish(new UserRegistered(child2Id, "lejla@internal.abilityhub.app", "Lejla", "Hodžić", childRole.Id, GuardianId: parentId));
        }
    }
}
