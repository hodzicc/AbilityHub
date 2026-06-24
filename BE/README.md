# AbilityHub

Centralized platform integrating multiple applications for people with Down syndrome:
single sign-on across apps, centralized user management, preference sync, and usage
statistics. Built as .NET 9 microservices behind an API gateway.

## Architecture

```
                       ┌─────────────┐
   client ──HTTP──▶    │   Gateway   │  (YARP, validates JWT, :8080)
                       └──────┬──────┘
        ┌───────────┬─────────┼──────────┬───────────┐
     /api/auth   /api/users /api/apps /api/settings /api/usage
        ▼           ▼          ▼           ▼           ▼
      Auth        Users    AppRegistry  Settings    Usage
        │           ▲
        └─ UserRegistered ─▶ (RabbitMQ / MassTransit)
```

- **Auth** — identity provider: credentials, login/refresh/logout, JWT issuing, user creation, QR pairing tokens for child mobile login. Owns `AbilityHub_Auth`.
- **Users** — user profiles, built from `UserRegistered` events; parent↔child guardian links. Owns `AbilityHub_Users`.
- **AppRegistry** — application catalog and child↔app assignments. Owns `AbilityHub_AppRegistry`.
- **Settings** — per-child and per-app UI preferences, daily time-limit / block restrictions. Owns `AbilityHub_Settings`.
- **Usage** — usage sessions, per-activity accessibility metrics, dashboards, weekly parent check-ins. Owns `AbilityHub_Usage`.
- **Gateway** — single entry point (YARP), validates JWTs at the edge, adds correlation ids.
- **Infrastructure** — SQL Server + RabbitMQ.

Each service owns its own database (database-per-service). Services communicate
asynchronously via integration events on RabbitMQ.

## Running with Docker (recommended)

```bash
cp .env.example .env      # then edit .env with real values
docker compose up --build
```

The gateway is exposed at **http://localhost:8080**. Everything else is reachable
only through it. RabbitMQ management UI: http://localhost:15672 (abilityhub / abilityhub123).

Example:

```bash
# Log in as the seeded admin (see ADMIN_PASSWORD in .env)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@abilityhub.local","password":"<ADMIN_PASSWORD>"}'

# Create a parent (Admin/Parent) — provisioning lives under the Auth service
curl -X POST http://localhost:8080/api/auth/users \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"email":"parent@example.com","password":"Pass123!","firstName":"Pat","lastName":"Roe","roleId":2}'

# Read the profile the Users service built from the event (Users service)
curl http://localhost:8080/api/users -H "Authorization: Bearer <accessToken>"

# As that parent, create a child — they are auto-linked as guardian
curl -X POST http://localhost:8080/api/auth/users \
  -H "Authorization: Bearer <parentAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{"email":"child@example.com","password":"Pass123!","firstName":"Kid","lastName":"Roe","roleId":3}'

# List that parent's children
curl http://localhost:8080/api/users/<parentId>/children \
  -H "Authorization: Bearer <parentAccessToken>"

# Deactivate a user (Admin only) — revokes their tokens and disables login
curl -X DELETE http://localhost:8080/api/auth/users/<userId> \
  -H "Authorization: Bearer <accessToken>"

# Register an app in the catalog (Admin)
curl -X POST http://localhost:8080/api/apps \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"key":"memory-game","name":"Memory Game","platform":"Mobile","version":"1.0","dataFormat":"abilityhub.usage.v1"}'

# Browse the catalog (any authenticated user)
curl http://localhost:8080/api/apps -H "Authorization: Bearer <accessToken>"

# As a parent, assign an app to your child (guardian check via Users service)
curl -X POST http://localhost:8080/api/apps/children/<childId> \
  -H "Authorization: Bearer <parentAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{"applicationId":"<appId>"}'

# List the apps a child uses
curl http://localhost:8080/api/apps/children/<childId> \
  -H "Authorization: Bearer <parentAccessToken>"

# Set global preferences for a child (parent/admin)
curl -X PUT http://localhost:8080/api/settings/children/<childId>/preferences \
  -H "Authorization: Bearer <parentAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{"preferences":{"primaryColor":"#0066CC","fontFamily":"OpenDyslexic","fontSize":"large"}}'

# Override the font just for one app
curl -X PUT http://localhost:8080/api/settings/children/<childId>/apps/<appId>/preferences \
  -H "Authorization: Bearer <parentAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{"preferences":{"fontSize":"x-large"}}'

# Set a daily time limit / block for an app
curl -X PUT http://localhost:8080/api/settings/children/<childId>/apps/<appId>/restriction \
  -H "Authorization: Bearer <parentAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{"dailyTimeLimitMinutes":60,"isBlocked":false}'

# What a mobile app fetches at login: merged prefs + restriction
curl http://localhost:8080/api/settings/children/<childId>/apps/<appId>/resolved \
  -H "Authorization: Bearer <childAccessToken>"

# An app reports usage for the signed-in child (standardized abilityhub.usage.v1 format)
curl -X POST http://localhost:8080/api/usage/report \
  -H "Authorization: Bearer <childAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{"applicationId":"<appId>","session":{"startedAt":"2026-05-31T09:00:00Z","endedAt":"2026-05-31T09:18:00Z"},"activities":[{"activityType":"memory-game","name":"Level 3","score":80,"occurredAt":"2026-05-31T09:10:00Z"}]}'

# Parent views the child's usage dashboard
curl http://localhost:8080/api/usage/children/<childId>/dashboard \
  -H "Authorization: Bearer <parentAccessToken>"

# Check remaining daily allowance (Usage reads the limit from Settings)
curl http://localhost:8080/api/usage/children/<childId>/apps/<appId>/limit-status \
  -H "Authorization: Bearer <childAccessToken>"

# Report usage WITH accessibility metrics (any metric the app can't measure is omitted)
curl -X POST http://localhost:8080/api/usage/report \
  -H "Authorization: Bearer <childAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{"applicationId":"<appId>","activities":[{"activityType":"daily-task","name":"Brush teeth","occurredAt":"2026-06-20T08:00:00Z","metrics":{"startedViaAction":true,"completedViaAction":true,"stepsCompleted":4,"stepsTotal":5,"durationSeconds":132,"hintsShown":1,"errorsCount":0}}]}'

# Dashboard filtered to one set of applications (statistics filtering — the frontend
# resolves an app-category filter to this id set itself, since Usage doesn't know
# about app categories; an empty value returns nothing for that set)
curl "http://localhost:8080/api/usage/children/<childId>/dashboard?applicationIds=<appId1>,<appId2>" \
  -H "Authorization: Bearer <parentAccessToken>"

# Submit / read a weekly parent evaluation (guardian or admin)
curl -X POST http://localhost:8080/api/checkins/children/<childId> \
  -H "Authorization: Bearer <parentAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{"weekStartDate":"2026-06-15","moodBefore":"good","moodAfter":"great","helpLevel":"minimal","performanceQuality":"good","safetyIncident":false,"dayContext":"normal","usesSkillOutsideApp":true}'
curl http://localhost:8080/api/checkins/children/<childId> \
  -H "Authorization: Bearer <parentAccessToken>"

# Issue a QR pairing token for a child (guardian/admin), then exchange it (mobile app)
curl -X POST http://localhost:8080/api/auth/children/<childId>/pairing-token \
  -H "Authorization: Bearer <parentAccessToken>"
# → {"token":"<opaque>","expiresAt":"..."}; the QR encodes { childId, token }
curl -X POST http://localhost:8080/api/auth/pairing/exchange \
  -H "Content-Type: application/json" \
  -d '{"token":"<opaque>"}'
# → normal {accessToken, refreshToken} for that child
```

## Running locally (without Docker)

Start the infrastructure containers, then each service:

```bash
docker compose up -d sqlserver rabbitmq
```

The JWT signing key is **not** stored in committed config. For local F5/`dotnet run`,
set it via user-secrets in each service that needs it (Auth, Users):

```bash
dotnet user-secrets --project Services/AbilityHub.Auth  set "Jwt:Key" "<your-dev-key>"
dotnet user-secrets --project Services/AbilityHub.Users set "Jwt:Key" "<your-dev-key>"
```

Use the same key in all services so tokens validate across them. In containers the key
comes from the `JWT_KEY` environment variable (see `docker-compose.yml` / `.env`).

Then, from `BE/`, start every service in its own terminal (each applies its own EF Core
migrations and seed data on startup):

```bash
dotnet run --project Services/AbilityHub.Auth
dotnet run --project Services/AbilityHub.Users
dotnet run --project Services/AbilityHub.AppRegistry
dotnet run --project Services/AbilityHub.Settings
dotnet run --project Services/AbilityHub.Usage
dotnet run --project Gateway/AbilityHub.Gateway
```

Default dev ports (HTTP, `ASPNETCORE_ENVIRONMENT=Development`):

| Service | Port |
|---|---|
| Gateway (use this one) | 5046 |
| Auth | 5289 |
| Users | 5290 |
| AppRegistry | 5125 |
| Settings | 5253 |
| Usage | 5293 |

Everything goes through the Gateway at `http://localhost:5046` when run this way (the
individual service ports are only useful for debugging one service directly).

From the repository root, [`start-all.ps1`](../start-all.ps1) automates all of the above —
infrastructure containers, all six services (each in its own PowerShell window), and the
frontend — for a one-command local stack on Windows.

## Security notes

- Passwords: salted PBKDF2-HMAC-SHA256.
- JWT: symmetric HS256; the signing key is supplied via env / user-secrets (not committed).
  A future phase can move to asymmetric (RSA/JWKS) signing.
- Connection-string and RabbitMQ credentials are still in `appsettings.json` for local
  convenience and should follow the same env-based pattern before any real deployment.
