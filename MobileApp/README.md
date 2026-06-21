# AbilityHub — Reference Mobile App (Flutter)

This is the **reference mobile application** that validates the whole AbilityHub
ecosystem end‑to‑end. It demonstrates every integration point a
real partner app would use:

1. **Login** — by scanning the **QR code** shown on the child's profile in the web
   app, or with the child's **email + password** (the same centralized SSO login).
2. **Preference sync** — it fetches the child's _resolved_ preferences (colour
   scheme, font, font size) from the platform and applies them to its own UI.
3. **Activities with accessibility metrics** — the child completes a task step by
   step; the app measures _started/finished via an explicit action, steps
   completed/total, duration, hints shown, and errors_ and reports them.
4. **Usage limits + instant lockout** — it reads the daily limit/block set by the
   parent and, the moment the limit is hit or the parent blocks the app, shows a
   full-screen lock and logs the child out. Changes arrive **in realtime** over a
   SignalR WebSocket (`/hubs/settings`), with a 30s poll as a fallback — so when the
   parent flips the block on the web, the child's app locks (or unlocks) on the spot.

After a child finishes a task here, open the web app's **Statistika** page → the
new activity and its metrics appear there. That round trip is the demo.

---

## 0. Which IDE should I use? (you already have the easiest one)

**Use Visual Studio Code** — it's already installed on this machine, and it's the
simplest way to run Flutter.

You will install two free things:

1. **Flutter SDK** (the toolchain).
2. The **Flutter extension** for VS Code (it also pulls in the Dart extension).

> Android Studio is the alternative if you later want a full Android emulator. You
> do **not** need it for the quick demo below — we'll run in **Chrome**.

---

## 1. Install Flutter (one time)

### Windows (your machine)

1. Download the Flutter SDK zip: <https://docs.flutter.dev/get-started/install/windows>
2. Unzip it to a folder **without spaces**, e.g. `C:\src\flutter`
   (do **not** put it in `C:\Program Files`).
3. Add `C:\src\flutter\bin` to your **PATH**:
   - Press Start → type "environment variables" → _Edit the system environment
     variables_ → _Environment Variables…_ → under _User variables_ select **Path**
     → _Edit_ → _New_ → paste `C:\src\flutter\bin` → OK everywhere.
4. **Close and reopen** VS Code / terminals so the new PATH is picked up.
5. Verify in a terminal:
   ```powershell
   flutter --version
   flutter doctor
   ```
   `flutter doctor` lists what's installed. For the **Chrome (web)** demo you only
   need the "Chrome" and "Flutter" checks to pass — Android items can stay red for now.

### Add the VS Code extension

- Open VS Code → Extensions (Ctrl+Shift+X) → search **"Flutter"** (publisher: Dart
  Code) → Install. (It installs the Dart extension automatically.)

---

## 2. Generate the platform folders + dependencies (one time)

This repo ships only the app code (`lib/`, `pubspec.yaml`). The platform folders
(`android/`, `web/`, …) are generated locally so they always match your Flutter
version. In a terminal:

```powershell
cd "C:\Users\esmaf\Desktop\Magistarski rad\AbilityHub\MobileApp"
flutter create --project-name abilityhub_mobile --org com.abilityhub .
flutter pub get
```

- `flutter create .` **does not overwrite** the existing `lib/`, `pubspec.yaml`, or
  tests — it only fills in the missing `android/ios/web/...` scaffolding.
- `flutter pub get` downloads the packages (http, provider, mobile_scanner, …).

> If `flutter pub get` complains about package versions (because you installed a
> very new Flutter), run `flutter pub upgrade --major-versions` once.

---

## 3. Start the backend + register this app (one time per environment)

1. **Run the backend** (from the `BE` folder):

   ```powershell
   cd "C:\Users\esmaf\Desktop\Magistarski rad\AbilityHub\BE"
   docker compose up --build
   ```

   The gateway comes up at <http://localhost:8080>.

2. **Register this app in the catalog and assign it to a child.** The mobile app
   finds its own catalog id by the key **`reference-mobile`**, so that app must
   exist and be assigned. Easiest via the **web app** (log in as admin → Aplikacije
   → add an app with key `reference-mobile`; then as the parent assign it to the
   child). Or with curl (see `BE/README.md`):
   ```bash
   # as admin
   curl -X POST http://localhost:8080/api/apps -H "Authorization: Bearer <adminToken>" \
     -H "Content-Type: application/json" \
     -d '{"key":"reference-mobile","name":"Reference Mobile","platform":"Mobile","version":"1.0","dataFormat":"abilityhub.usage.v1"}'
   # as the parent, assign it to the child
   curl -X POST http://localhost:8080/api/apps/children/<childId> -H "Authorization: Bearer <parentToken>" \
     -H "Content-Type: application/json" -d '{"applicationId":"<appId>"}'
   ```
   > If you skip this, the app still runs and you can log in, but it shows a banner
   > and won't record statistics (it has no catalog id to attribute usage to).

---

## 4. Run the app

### Option A — Chrome / web (recommended; **no Android SDK needed**)

```powershell
flutter run -d chrome --web-port=8090 --dart-define=API_BASE_URL=http://localhost:8080
```

- The fixed port `8090` is already in the gateway's CORS allow‑list
  (`Cors:AllowedOrigins` in `BE/Gateway/.../appsettings.json`).
- In VS Code you can instead press **F5** (Run → choose the **Chrome** device in the
  bottom‑right status bar) — but then set the API URL once via a launch config, or
  just use the terminal command above which already includes it.

### Option B — Android emulator or phone (full QR‑camera experience)

- Needs Android Studio + an emulator or a USB phone with developer mode.
- Emulator (host is reached via the special IP `10.0.2.2`, which is the default):
  ```powershell
  flutter run
  ```
- Physical phone on the same Wi‑Fi (replace with your PC's LAN IP):
  ```powershell
  flutter run --dart-define=API_BASE_URL=http://192.168.1.20:8080
  ```
  Find your IP with `ipconfig` (IPv4 Address).

---

## 5. Logging in (the demo)

**With password (easiest for the web/Chrome run):** choose the **Lozinka** tab and
enter the child's email + password (the account the parent created for the child).

**With the QR code (best on a real phone):**

1. In the **web app**, open the child's profile → **Prijava** tab → a QR code is
   shown (`QrPairingCard`).
2. In the mobile app choose the **QR kod** tab and scan it. The app exchanges the
   scanned token for a session (`POST /api/auth/pairing/exchange`).
   - On Chrome you can scan an on‑screen QR with your webcam, or use the **"zalijepi
     token"** field as a fallback.

Then: pick a task → **Počni** → complete each step (try **Pomoć** and **Vrati se**
to generate hint/error metrics) → **Pošalji i završi**. Refresh the web
**Statistika** page to see the activity, its per‑metric badges, and the updated
average‑progress / consistency numbers.

---

## 6. Platform permissions (only for Android/iOS builds)

`flutter create` generates these files; add the camera permission for QR scanning:

- **Android** — `android/app/src/main/AndroidManifest.xml`: the `mobile_scanner`
  plugin already declares the camera permission, but ensure
  `minSdkVersion` is ≥ 21 (set in `android/app/build.gradle`).
- **iOS** — `ios/Runner/Info.plist`: add
  ```xml
  <key>NSCameraUsageDescription</key>
  <string>Skeniranje QR koda za prijavu.</string>
  ```
- **Web** — no config; the browser asks for camera permission at runtime
  (works on `localhost`/https).

---

## 7. Troubleshooting

| Symptom                               | Fix                                                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Ne mogu se povezati na server"       | Backend not running, or wrong `API_BASE_URL`. Web → `http://localhost:8080`; Android emulator → `http://10.0.2.2:8080`; phone → your PC's LAN IP. |
| CORS error in the browser console     | Run web on `--web-port=8090` (it's allow‑listed), or add your origin to `Cors:AllowedOrigins` in the gateway `appsettings.json` and restart it.   |
| Banner "aplikacija nije registrovana" | Register catalog key `reference-mobile` and assign it to the child (step 3).                                                                      |
| Login fails                           | Use the child's real credentials, or a fresh QR (tokens expire after 5 min and are single‑use).                                                   |
| `flutter pub get` version conflict    | `flutter pub upgrade --major-versions`.                                                                                                           |

---

## 8. Project structure

```
MobileApp/
  lib/
    config.dart                 API base URL + app key (override via --dart-define)
    models/                     DTOs mirroring the backend (auth, profile, settings, usage report, …)
    services/
      api_client.dart           http + bearer + auto token-refresh on 401
      abilityhub_api.dart       one method per gateway endpoint used
      token_store.dart          persists access/refresh tokens
    state/
      app_state.dart            session, child, app id, settings, limit (ChangeNotifier)
      preferences_theme.dart    resolved preferences → ThemeData (mirrors FE/lib/preferences.ts)
    data/demo_activities.dart    the reference tasks (steps + hints)
    screens/
      login_screen.dart         QR scan + credential login
      home_screen.dart          tasks + daily-limit status
      activity_screen.dart      step-by-step task → captures & reports metrics
    main.dart                   wires Provider + routes by session status
  test/widget_test.dart         network-free unit tests
  pubspec.yaml
```

Every backend call goes through the gateway and uses the contracts documented in
`BE/docs/usage-format.md`, `BE/API_CONTRACTS_NEEDED.md`, and
`BE/docs/integration-notes.md`.
