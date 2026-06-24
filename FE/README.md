# AbilityHub — Frontend

Next.js 15 (App Router) web app for parents and admins: manage children, assign
applications, configure accessibility preferences, view usage statistics, and submit
weekly evaluations. Talks to the backend exclusively through the API Gateway.

## Requirements

- Node.js 20+
- The backend running and reachable (see [`../BE/README.md`](../BE/README.md)) — by
  default at `http://localhost:5046` (`dotnet run`) or `http://localhost:8080` (Docker).

## Setup

```bash
cd FE
npm install
```

Configure the API base URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5046
```

(Use `http://localhost:8080` instead if the backend is running via Docker Compose.)

## Running

```bash
npm run dev
```

Open `http://localhost:3000`.

## Logging in

There's no public sign-up for parents in this build — accounts are created by an admin
(`/dashboard/admin`) or seeded by the backend on first run:

- Admin: `admin@abilityhub.local` / the password set in `BE/.env` as `ADMIN_PASSWORD`.
- Demo parent (Development environment only): `emina@abilityhub.local` / `Roditelj123!`,
  with two pre-linked demo children.

Child accounts log in to the companion mobile app via the QR pairing code generated on
the child's profile page ("Prijava" tab) — they don't use this web app.

## Production build

```bash
npm run build
npm run start
```

## Type checking

```bash
npm run typecheck
```

## Project layout

```
app/            Next.js routes (App Router) — (auth) and (dashboard) route groups
components/     Reusable UI components, grouped by feature (children, applications, …)
lib/            API client (lib/api), i18n strings (lib/i18n), shared types and helpers
hooks/          Shared React hooks
```

Localization: every user-facing string goes through `useTranslation()` / `t('...')`,
backed by `lib/i18n/en.json` and `lib/i18n/bs.json`. Both files must stay in sync —
add a key to both when adding new UI text.
