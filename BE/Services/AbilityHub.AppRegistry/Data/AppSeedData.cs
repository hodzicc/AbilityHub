using AbilityHub.AppRegistry.Entities;
using Microsoft.EntityFrameworkCore;

namespace AbilityHub.AppRegistry.Data
{
    public static class AppSeedData
    {
        private static readonly Guid SystemId = new("00000000-0000-0000-0000-000000000001");

        public static async Task InitializeAsync(AppRegistryDbContext db)
        {
            if (await db.Applications.AnyAsync())
                return;

            var now = DateTime.UtcNow;

            db.Applications.AddRange(
                new Application
                {
                    Id = Guid.NewGuid(), Key = "ucimo-slova", Name = "Učimo Slova",
                    Description = "Interaktivna aplikacija za učenje slova i čitanja prilagođena djeci s Down sindromom. Koristi slike, zvukove i animacije.",
                    Category = "education", IconName = "BookOpen", Color = "#4F46E5",
                    Platform = "Mobile", Version = "2.1.0", DataFormat = "abilityhub.usage.v1",
                    MinAge = 4, MaxAge = 12, IsActive = true,
                    FeaturesJson = "[\"Prepoznavanje slova\",\"Slaganje riječi\",\"Zvučne nagrade\",\"Prilagodljiva težina\"]",
                    CreateUserId = SystemId, CreatedAt = now
                },
                new Application
                {
                    Id = Guid.NewGuid(), Key = "brojalica", Name = "Brojalica",
                    Description = "Aplikacija za učenje brojeva i osnovnih matematičkih operacija kroz igru i vizualne zadatke.",
                    Category = "education", IconName = "Calculator", Color = "#F59E0B",
                    Platform = "Mobile", Version = "1.4.2", DataFormat = "abilityhub.usage.v1",
                    MinAge = 5, MaxAge = 14, IsActive = true,
                    FeaturesJson = "[\"Brojanje predmeta\",\"Zbrajanje i oduzimanje\",\"Vizualni prikaz\",\"Nagrade za napredak\"]",
                    CreateUserId = SystemId, CreatedAt = now
                },
                new Application
                {
                    Id = Guid.NewGuid(), Key = "moja-rutina", Name = "Moja Rutina",
                    Description = "Pomaže djeci da savladaju dnevne rutine kroz slike, raspored i podsjetnik za svaki korak.",
                    Category = "daily", IconName = "CalendarCheck", Color = "#F97316",
                    Platform = "Mobile", Version = "3.0.1", DataFormat = "abilityhub.usage.v1",
                    MinAge = 3, MaxAge = 18, IsActive = true,
                    FeaturesJson = "[\"Dnevni raspored\",\"Slikovne kartice\",\"Podsjetnici\",\"Praćenje završenih zadataka\"]",
                    CreateUserId = SystemId, CreatedAt = now
                },
                new Application
                {
                    Id = Guid.NewGuid(), Key = "govor-i-glas", Name = "Govor i Glas",
                    Description = "Vježbe govora i artikulacije uz glasovne povratne informacije. Osmišljeno uz podršku logopeda.",
                    Category = "speech", IconName = "Mic", Color = "#8B5CF6",
                    Platform = "Mobile", Version = "1.2.0", DataFormat = "abilityhub.usage.v1",
                    MinAge = 3, MaxAge = 16, IsActive = true,
                    FeaturesJson = "[\"Vježbe artikulacije\",\"Snimanje glasa\",\"Povratna informacija\",\"Logopedski sadržaj\"]",
                    CreateUserId = SystemId, CreatedAt = now
                },
                new Application
                {
                    Id = Guid.NewGuid(), Key = "slagalica", Name = "Slagalica",
                    Description = "Puzzle igra s prilagodljivim brojem dijelova koja razvija prostornu inteligenciju i fine motoričke vještine.",
                    Category = "games", IconName = "Puzzle", Color = "#10B981",
                    Platform = "Mobile", Version = "2.3.1", DataFormat = "abilityhub.usage.v1",
                    MinAge = 4, MaxAge = 16, IsActive = true,
                    FeaturesJson = "[\"4–48 dijelova\",\"Tematske slike\",\"Mjerenje vremena\",\"Nagrade\"]",
                    CreateUserId = SystemId, CreatedAt = now
                },
                new Application
                {
                    Id = Guid.NewGuid(), Key = "motorika", Name = "Motorika",
                    Description = "Vježbe fine i grube motorike kroz interaktivne zadatke crtanja, hvatanja i preciznih pokreta prstima.",
                    Category = "motor", IconName = "Hand", Color = "#EF4444",
                    Platform = "Mobile", Version = "1.0.5", DataFormat = "abilityhub.usage.v1",
                    MinAge = 3, MaxAge = 12, IsActive = true,
                    FeaturesJson = "[\"Vježbe prstiju\",\"Crtanje linija\",\"Hvatanje objekata\",\"Prilagodljiva osjetljivost\"]",
                    CreateUserId = SystemId, CreatedAt = now
                }
            );

            await db.SaveChangesAsync();
        }
    }
}
