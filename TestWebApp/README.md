# AbilityHub — Reference Web App (integration test harness)

A single self-contained `index.html` that validates the **web** integration path
end-to-end, the same way [`MobileApp/`](../MobileApp/README.md) validates the mobile
one. It demonstrates every integration point a real partner **web** app would use,
against the same API gateway:

1. **SSO login** — child **email + password**, or a **QR pairing token** exchange
   (`/api/auth/pairing/exchange`). Both send this app's `appKey` so the backend
   rejects a child the app isn't assigned to.
2. **Preference sync** — fetches the child's _resolved_ preferences (colour scheme,
   font, font size, high-contrast, reduced-motion) and applies them to its own UI
   live.
3. **Activities with accessibility metrics** — a 5-step task measures _started/finished
   via action, steps completed/total, duration, hints shown, errors_ and reports them
   (standardized `abilityhub.usage.v1`), plus the foreground session time.
4. **Usage limits + instant lockout** — reads the daily limit/block and subscribes to
   the Settings **SignalR** hub (`/hubs/settings`); when a parent blocks the app or the
   limit is hit, a full-screen lock appears immediately (30s poll as a fallback).

After you finish the task here, open the web app's **Statistika** page → the new
activity and its metrics appear there. That round trip is the demo.

## Prerequisites

1. **Backend running** — start the stack from the repo root (`.\start-all.ps1`) or run
   the services per [`BE/README.md`](../BE/README.md). Gateway at `http://localhost:5046`
   (local dev) or `http://localhost:8080` (Docker).
2. **App registered in the catalog** — the `reference-web` entry is seeded automatically
   into a **fresh** AppRegistry DB (`AppSeedData.cs`). For an **existing** DB, run
   [`../seed_web_app.sql`](../seed_web_app.sql) once against SQL Server.
3. **App assigned to a child** — in the web dashboard (parent/admin) → **Aplikacije**,
   assign *Referentna Web Aplikacija* to the child you'll sign in as. Without the
   assignment, login is rejected with "app not assigned".
4. **A child that can log in** — the seeded demo children are QR-only. Either create a
   child with a password (web dashboard / `POST /api/auth/users`), or generate a QR
   pairing token on the child's profile (**Prijava** tab) and paste it in the QR tab.

## Run it

No build step — it's one static file. Serve the folder (a `file://` open works too,
but a server avoids CORS surprises):

```powershell
# from the repo root
cd TestWebApp
python -m http.server 8091
# → open http://localhost:8091
```

Or use the `test-web-app` configuration in `.claude/launch.json`.

## Using it

1. Set **Gateway URL** (`http://localhost:5046` by default) and **App key**
   (`reference-web`).
2. Sign in as the child (email+password, or paste a QR pairing token).
3. Watch the **Integration log** for every request/response.
4. **Preference sync** — change the child's preferences in the web dashboard, click
   **Re-sync now** here, and the UI re-themes.
5. **Activity** — *Start task*, complete steps (optionally log hints/mistakes); each
   step reports live progress, the final step reports completion with metrics.
6. **Realtime lockout** — set a daily limit or block the app in the web dashboard; the
   lock overlay appears here instantly via SignalR.

## How it maps to the mobile reference app

Same gateway endpoints, same contracts — see [`MobileApp/lib/services/abilityhub_api.dart`](../MobileApp/lib/services/abilityhub_api.dart):
`POST /api/auth/login` · `/api/auth/pairing/exchange` · `GET /api/users/me` ·
`GET /api/apps` · `GET /api/settings/children/{c}/apps/{a}/resolved` ·
`GET /api/usage/children/{c}/apps/{a}/limit-status` · `POST /api/usage/report` ·
SignalR `/hubs/settings` (`settingsChanged`). Access tokens auto-refresh once on a 401.
