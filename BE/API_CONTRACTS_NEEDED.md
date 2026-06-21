# Backend endpoints needed by the frontend (not yet implemented)

The frontend has been built against **mocks** for the items below, so the screens are fully demoable today. Each mock lives in `FE/lib/api/mocks.ts` and is called from a single, clearly-named function (`apiGetActivityMetrics`, `apiGetChildPairingToken`, `apiSubmitWeeklyCheckIn`, `apiGetWeeklyCheckIns`). Once a real endpoint exists, swap the mock import for a real `apiFetch`-based client function with the same signature — no other frontend code needs to change.

This list comes from advisor feedback asking for richer, accessibility-focused progress metrics, weekly parent evaluations, and QR-code child login (already used in the team's other mobile apps for the Down Syndrome Association).

---

## 1. Per-activity accessibility metrics

**Why**: "Time spent" alone doesn't tell a parent whether an activity helped. We need finer-grained signals: was it started/finished via an explicit action, how many of the activity's steps were completed, how long it took, how many hints were shown, how many errors occurred.

**Current mock**: `apiGetActivityMetrics(activityId)` in `FE/lib/api/mocks.ts` — returns deterministic fake numbers seeded from the activity id.

**Proposed real contract**

- Mobile/web apps already report activities via the usage-ingestion path that produces `RecentActivityDto` (see `AbilityHub.Usage`). Extend that ingestion payload with an **optional** metrics object — apps that can't report a field simply omit it:

```json
POST /api/usage/children/{childId}/activities
{
  "applicationId": "...",
  "activityType": "letter-match",
  "name": "Pronađi slovo A",
  "occurredAt": "2026-06-20T10:00:00Z",
  "detail": "...",
  "metrics": {
    "startedViaAction": true,
    "completedViaAction": true,
    "stepsCompleted": 4,
    "stepsTotal": 5,
    "durationSeconds": 132,
    "hintsShown": 1,
    "errorsCount": 0
  }
}
```

- Expose it back out on the dashboard/activity read endpoints (`GET /api/usage/children/{childId}/dashboard`, or wherever `RecentActivityDto` is currently returned) by adding the same optional `metrics` object to each activity entry.
- Aggregate fields would also be useful at the dashboard level, e.g. `avgProgressPercent` (computed from `stepsCompleted`/`stepsTotal` across the period) and `weeklyConsistency` (fraction of scheduled days the activity was actually done) — frontend's `avgProgress` stat is currently a rough proxy (% of assigned apps with any usage) and should be replaced by this once available.
- All fields optional/nullable — most current demo apps won't send most of them; frontend already renders "Nije dostupno" when a field is missing.

**Frontend usage today**: `FE/app/(dashboard)/dashboard/statistics/page.tsx` — clicking a recent-activity row expands per-metric badges.

---

## 2. Weekly parent evaluation (check-in)

**Why**: Objective in-app metrics don't capture mood, real-world carryover, or safety incidents. Advisor asked for a short weekly questionnaire parents fill out per child.

**Current mock**: `apiSubmitWeeklyCheckIn` / `apiGetWeeklyCheckIns` in `FE/lib/api/mocks.ts`, backed by `localStorage` so it persists across reloads in demos.

**Proposed real contract**

```http
POST /api/checkins/children/{childId}
GET  /api/checkins/children/{childId}
```

Request/response body (one per ISO week, keyed by `childId` + `weekStartDate`):

```json
{
  "id": "string",
  "childId": "guid",
  "weekStartDate": "2026-06-15",
  "moodBefore": "great|good|neutral|difficult|hard",
  "moodAfter": "great|good|neutral|difficult|hard",
  "helpLevel": "none|minimal|moderate|extensive",
  "performanceQuality": "excellent|good|partial|poor",
  "safetyIncident": false,
  "safetyIncidentNotes": "string|null",
  "dayContext": "normal|poor-sleep|illness|routine-change|stress|other",
  "dayContextNotes": "string|null",
  "usesSkillOutsideApp": true,
  "generalNotes": "string|null",
  "createdAt": "2026-06-20T10:00:00Z"
}
```

Authorization should mirror the existing pattern in `AbilityHub.Users`/`AbilityHub.AppRegistry`/`AbilityHub.Settings`: admin or the guardian of that child (reuse `IUsersServiceClient.IsGuardianOfChildAsync`).

**Frontend usage today**: `FE/components/statistics/weekly-checkin-card.tsx`, shown as a "Procjene roditelja" tab on the statistics page.

---

## 3. QR-code child login / device pairing

**Why**: Mobile apps already built for the Down Syndrome Association use QR-code login for child users instead of typed credentials. The platform should issue the pairing code; mobile apps exchange it for a session.

**Current mock**: `apiGetChildPairingToken(childId)` in `FE/lib/api/mocks.ts` — fabricates a token string client-side, no real security.

**Proposed real contract**

```http
POST /api/auth/children/{childId}/pairing-token
```
- Caller: the child's guardian or an admin (same authorization pattern as elsewhere).
- Issues a **short-lived (e.g. 5 min), single-use** opaque token tied to that child's credential id.
- Response: `{ "token": "string", "expiresAt": "2026-06-20T10:05:00Z" }`.

```http
POST /api/auth/pairing/exchange
{ "token": "string" }
```
- Called by the mobile app after scanning the QR code (which encodes `{ childId, token }`).
- Validates the token (exists, not expired, not already used), marks it used, and returns a normal access/refresh token pair for that child — same shape as `POST /api/auth/login`.

**Frontend usage today**: `FE/components/children/qr-pairing-card.tsx`, shown on the child profile's "Prijava" tab. It renders a QR code encoding `{ childId, token }` and lets the parent regenerate it.

---

## Summary table

| Feature | Mock location | Real endpoint(s) needed |
|---|---|---|
| Per-activity metrics | `apiGetActivityMetrics` | Extend usage ingestion + dashboard response with optional `metrics` |
| Weekly parent check-in | `apiSubmitWeeklyCheckIn`, `apiGetWeeklyCheckIns` | `POST/GET /api/checkins/children/{childId}` |
| QR child login | `apiGetChildPairingToken` | `POST /api/auth/children/{childId}/pairing-token`, `POST /api/auth/pairing/exchange` |
| Real average progress | n/a (FE proxy in `dashboard/page.tsx` and `statistics/page.tsx`) | `avgProgressPercent` / `weeklyConsistency` on dashboard response, once metrics above exist |
