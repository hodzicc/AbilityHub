# AbilityHub

A centralized platform integrating web and mobile applications for people with Down
syndrome: single sign-on, user management, accessibility preference sync, usage
tracking, and progress statistics.

## Structure

```txt
AbilityHub/
  BE/          .NET 9 microservices behind an API gateway (Auth, Users, AppRegistry, Settings, Usage)
  FE/          Next.js web app (parent / admin)
  MobileApp/   Flutter reference mobile app (user / child)
```

Each part has its own detailed guide:

- [`BE/README.md`](BE/README.md) — backend microservices architecture and how to run them (Docker or locally).
- [`FE/README.md`](FE/README.md) — running the web app and login credentials.
- [`MobileApp/README.md`](MobileApp/README.md) — running the reference mobile app (QR login, preference sync, activity reporting with accessibility metrics).

## Quick start (Windows, everything at once)

From the repository root:

```powershell
.\start-all.ps1
```

This starts: SQL Server + RabbitMQ (Docker), all 6 backend services (each in its own
window, `dotnet run`), and the frontend (`npm run dev`).

- Frontend: http://localhost:3000
- Gateway API: http://localhost:5046
- RabbitMQ management UI: http://localhost:15672 (`abilityhub` / `abilityhub123`)

## Running manually

See [`BE/README.md`](BE/README.md) for running the backend services (Docker Compose
or `dotnet run` per service) and [`FE/README.md`](FE/README.md) for the frontend.

## Logging in

There's no public sign-up for parents — accounts are created by an admin
(`/dashboard/admin`) or seeded by the backend on first run (Development environment
only, for demo users):

```txt
Admin:        admin@abilityhub.local       (password from BE/.env, ADMIN_PASSWORD)
Demo parent:  emina@abilityhub.local       Roditelj123!   (with two linked children)
```

Children log in to the mobile app by scanning the QR code generated on their profile
page (the "Prijava" tab) — they don't use the web app.
