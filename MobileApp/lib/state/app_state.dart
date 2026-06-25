import 'dart:async';

import 'package:flutter/material.dart';
import 'package:signalr_netcore/signalr_client.dart';

import '../config.dart';
import '../models/limit_status.dart';
import '../models/profile.dart';
import '../models/resolved_settings.dart';
import '../models/usage_report.dart';
import '../services/abilityhub_api.dart';
import '../services/api_client.dart';
import '../services/token_store.dart';
import '../util/uuid.dart';
import 'preferences_theme.dart';

enum SessionStatus { loading, unauthenticated, authenticated }

/// Single source of truth for the app: the session, the signed-in child, this
/// app's catalog id, the resolved preferences (→ theme) and the current limit
/// status. Screens read from it via Provider and call its methods to act.
class AppState extends ChangeNotifier with WidgetsBindingObserver {
  AppState() {
    _tokens = TokenStore();
    final client = ApiClient(_tokens);
    _api = AbilityHubApi(client);
    WidgetsBinding.instance.addObserver(this);
  }

  late final TokenStore _tokens;
  late final AbilityHubApi _api;

  // Foreground time-in-app tracking. The elapsed time is tracked locally and only
  // *reported* to the backend at two moments: when the child leaves the app, and
  // when their daily time runs out (a one-shot timer fires at that instant).
  String? _appSessionId;
  DateTime? _appSessionStart;
  bool _foreground = true;

  SessionStatus status = SessionStatus.loading;
  UserProfile? child;
  String? appId;
  ResolvedSettings settings = ResolvedSettings.empty();
  LimitStatus? limit;
  String? error;

  HubConnection? _hub;
  Timer? _pollTimer;
  // One-shot timer that fires the instant the daily allowance runs out, so the child
  // is locked out on time even if they just sit in the app without completing tasks.
  Timer? _limitTimer;

  AppPreferences get prefs => AppPreferences.fromSettings(settings);
  ThemeData get theme => buildTheme(prefs);

  /// True once we know this app exists in the catalog. When false, usage can't be
  /// attributed to an app, so the UI nudges the user to register/assign it.
  bool get appRegistered => appId != null && appId!.isNotEmpty;

  /// The child must be locked out: the parent blocked the app, or the daily limit
  /// is reached. Drives the full-screen lockout overlay.
  bool get lockedOut => limit != null && (limit!.isBlocked || limit!.limitReached);

  /// When the current foreground period started (null when not counting). Used by
  /// the UI to show a live "time in app" counter — independent of any task.
  DateTime? get appSessionStart => _appSessionStart;
  bool get isCountingAppTime => _appSessionId != null;

  /// Call once at startup: restore any saved session.
  Future<void> bootstrap() async {
    await _tokens.load();
    if (_tokens.hasSession) {
      await _loadSession();
    } else {
      status = SessionStatus.unauthenticated;
      notifyListeners();
    }
  }

  Future<void> loginWithCredentials(String email, String password) async {
    final res = await _api.login(email, password);
    if (!res.success) {
      throw Exception('Pogrešan email ili lozinka.');
    }
    await _tokens.save(res.accessToken, res.refreshToken);
    await _loadSession();
  }

  Future<void> loginWithPairingToken(String token) async {
    final res = await _api.exchangePairingToken(token);
    if (!res.success) {
      throw Exception('QR kod nije važeći ili je istekao.');
    }
    await _tokens.save(res.accessToken, res.refreshToken);
    await _loadSession();
  }

  Future<void> logout() async {
    _stopTimeTracking(flush: true);
    await _stopRealtime();
    final rt = _tokens.refreshToken;
    if (rt != null) await _api.logout(rt);
    await _tokens.clear();
    child = null;
    appId = null;
    settings = ResolvedSettings.empty();
    limit = null;
    status = SessionStatus.unauthenticated;
    notifyListeners();
  }

  // Realtime: connect to the Settings SignalR hub so a changed *limit/block* applies
  // instantly. Preferences are deliberately NOT applied live — they're loaded once
  // per session (and on resume), so a child's look only changes the next time they
  // use the app, not the second a parent edits it on the web. A 30s heartbeat also
  // commits the live foreground time and re-checks the limit, so the daily allowance
  // is enforced even while the child just sits in the app (and as a fallback if the
  // socket drops).
  Future<void> _startRealtime() async {
    if (child == null) return;

    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) => _heartbeat());

    if (_hub != null) return;
    try {
      final hub = HubConnectionBuilder()
          .withUrl(
            '${AppConfig.apiBaseUrl}/hubs/settings',
            options: HttpConnectionOptions(
              accessTokenFactory: () async => _tokens.accessToken ?? '',
            ),
          )
          .withAutomaticReconnect()
          .build();
      // Re-check only the limit on a push — preferences are not applied mid-session.
      hub.on('settingsChanged', (args) {
        refreshLimit();
      });
      await hub.start();
      _hub = hub;
    } catch (_) {
      // Best-effort; the poll timer still delivers updates.
    }
  }

  Future<void> _stopRealtime() async {
    _pollTimer?.cancel();
    _pollTimer = null;
    _limitTimer?.cancel();
    _limitTimer = null;
    final hub = _hub;
    _hub = null;
    if (hub != null) {
      try {
        await hub.stop();
      } catch (_) {}
    }
  }

  /// Periodic heartbeat: commit the live foreground time (the server upserts the same
  /// session row, so today's total grows live) and re-check the limit. This is what
  /// makes the daily allowance get enforced while the child simply stays in the app.
  Future<void> _heartbeat() async {
    await _reportAppTime();
    await refreshLimit();
  }

  /// Schedules a one-shot lockout for the exact moment the daily allowance runs out.
  /// Without this, enforcement would lag up to a full heartbeat (30s); with it the
  /// child is locked the second their remaining minutes elapse. Re-armed whenever the
  /// limit is refreshed or time-tracking starts/stops.
  void _scheduleLimitTimer() {
    _limitTimer?.cancel();
    _limitTimer = null;

    // Only meaningful while actively counting against a finite daily limit.
    if (_appSessionId == null) return;
    final remaining = limit?.remainingMinutes;
    if (remaining == null) return; // no daily limit set

    final remainingSeconds = remaining * 60;
    if (remainingSeconds <= 0) return; // already at/over the limit — refreshLimit locks

    _limitTimer = Timer(Duration(seconds: remainingSeconds), () async {
      // Allowance just ran out: commit the time and re-check, which flips the lockout.
      await _reportAppTime();
      await refreshLimit();
    });
  }

  // ---- Time in app (foreground usage) ----
  // The elapsed time is kept locally; it's only *reported* to the backend when the
  // child leaves the app (flush) or when their daily time runs out (one-shot timer).

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _foreground = state == AppLifecycleState.resumed;
    if (_foreground) {
      // Coming back: re-check the limit, then resume counting.
      refreshSession();
    }
    _syncTimeTracking();
  }

  /// Starts/stops the foreground period to match the current state: count only while
  /// signed in, in the foreground, not locked out, and attributable to an app.
  void _syncTimeTracking() {
    final shouldTrack = status == SessionStatus.authenticated &&
        _foreground &&
        !lockedOut &&
        appRegistered;

    if (shouldTrack && _appSessionId == null) {
      _appSessionId = uuidV4();
      _appSessionStart = DateTime.now();
      notifyListeners();
    } else if (!shouldTrack && _appSessionId != null) {
      _stopTimeTracking(flush: true);
      notifyListeners();
    }

    // (Re)arm the precise lockout timer for the current tracking + limit state.
    _scheduleLimitTimer();
  }

  /// The current foreground period as a session payload (or null if not counting).
  /// It's sent alongside each activity report, so the child's time is committed
  /// whenever a step or task completes — plus once more when they leave (flush).
  UsageSessionInput? _currentSession() {
    if (_appSessionId == null || _appSessionStart == null) return null;
    return UsageSessionInput(
      id: _appSessionId,
      startedAt: _appSessionStart!,
      endedAt: DateTime.now(),
    );
  }

  Future<void> _reportAppTime() async {
    final session = _currentSession();
    if (session == null || !appRegistered) return;
    try {
      await _api.reportUsage(UsageReport(applicationId: appId!, session: session));
    } catch (_) {
      // Best-effort.
    }
  }

  void _stopTimeTracking({required bool flush}) {
    if (flush) {
      // Report the time spent this period as the child leaves.
      _reportAppTime();
    }
    _appSessionId = null;
    _appSessionStart = null;
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _stopTimeTracking(flush: true);
    _stopRealtime();
    super.dispose();
  }

  Future<void> _loadSession() async {
    try {
      child = await _api.getMe();
      appId = await _api.resolveOwnAppId();

      if (appRegistered) {
        // Best-effort: a brand-new child may have no preferences/limits yet.
        settings = await _safe(() => _api.getResolvedSettings(child!.id, appId!),
            ResolvedSettings.empty());
        limit = await _safe<LimitStatus?>(() => _api.getLimitStatus(child!.id, appId!), null);
      }

      error = null;
      status = SessionStatus.authenticated;
      notifyListeners();
      await _startRealtime();
      _syncTimeTracking();
    } on ApiException catch (e) {
      if (e.statusCode == 401) {
        await _tokens.clear();
        status = SessionStatus.unauthenticated;
      } else {
        error = e.message;
        status = SessionStatus.authenticated;
      }
      notifyListeners();
    }
  }

  /// Re-fetch **preferences + limit**. Preferences are applied only at points that
  /// count as the child "using the app again" — session start and resume — never
  /// from a live push, so a parent's web edit shows up on the child's next use.
  Future<void> refreshSession() async {
    if (child == null || !appRegistered) return;
    settings = await _safe(() => _api.getResolvedSettings(child!.id, appId!), settings);
    limit = await _safe(() => _api.getLimitStatus(child!.id, appId!), limit);
    notifyListeners();
    _syncTimeTracking();
  }

  /// Re-fetch only the **limit** (not preferences). Used by the realtime push, the
  /// poll, and after activity reports — so the block/lockout stays instant while the
  /// look stays fixed for the session.
  Future<void> refreshLimit() async {
    if (child == null || !appRegistered) return;
    limit = await _safe(() => _api.getLimitStatus(child!.id, appId!), limit);
    notifyListeners();
    // A changed limit may flip lockout on/off — keep time-tracking in sync.
    _syncTimeTracking();
  }

  /// Reports an activity with its metrics and completion **percentage**
  /// (score = stepsCompleted / stepsTotal × 100). Pass a stable [activityId] and
  /// [inProgress] = true to send live step-by-step progress (the same row is
  /// updated as the child advances); send [inProgress] = false when finished.
  /// No session here — time in app is tracked separately by the foreground
  /// heartbeat, so task time isn't double-counted.
  Future<void> reportActivity({
    required String activityType,
    required String name,
    required DateTime occurredAt,
    required ActivityMetricsInput metrics,
    String? activityId,
    bool inProgress = false,
    String? detail,
    Map<String, String>? attributes,
  }) async {
    if (!appRegistered) return;

    double? score;
    final completed = metrics.stepsCompleted;
    final total = metrics.stepsTotal;
    if (completed != null && total != null && total > 0) {
      score = (completed / total * 100).roundToDouble();
    }

    await _api.reportUsage(UsageReport(
      applicationId: appId!,
      // Commit the foreground time alongside the activity — the child's time is
      // reported whenever a step or task completes (not on a heartbeat).
      session: _currentSession(),
      activities: [
        ActivityInput(
          id: activityId,
          inProgress: inProgress,
          activityType: activityType,
          name: name,
          occurredAt: occurredAt,
          score: score,
          detail: detail,
          attributes: attributes,
          metrics: metrics,
        ),
      ],
    ));
    // Used time just grew → re-check the limit (may flip lockout on). Preferences
    // are intentionally not re-fetched here.
    await refreshLimit();
  }

  Future<T> _safe<T>(Future<T> Function() op, T fallback) async {
    try {
      return await op();
    } catch (_) {
      return fallback;
    }
  }
}
