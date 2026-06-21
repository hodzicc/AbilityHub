import '../config.dart';
import '../models/auth_models.dart';
import '../models/catalog.dart';
import '../models/limit_status.dart';
import '../models/profile.dart';
import '../models/resolved_settings.dart';
import '../models/usage_report.dart';
import 'api_client.dart';

/// All AbilityHub gateway calls the mobile app needs, in one place. Thin mapping
/// from JSON to the model classes; networking/auth lives in [ApiClient].
class AbilityHubApi {
  AbilityHubApi(this._client);
  final ApiClient _client;

  // ---- Auth ----

  /// Credential login (centralized SSO — the same login that works on the web).
  Future<AuthResponse> login(String email, String password) async {
    final json = await _client.postAnonymousJson(
        '/api/auth/login', {'email': email, 'password': password});
    return AuthResponse.fromJson(json);
  }

  /// Redeems a scanned QR pairing token for a child session.
  Future<AuthResponse> exchangePairingToken(String token) async {
    final json = await _client
        .postAnonymousJson('/api/auth/pairing/exchange', {'token': token});
    return AuthResponse.fromJson(json);
  }

  Future<void> logout(String refreshToken) async {
    try {
      await _client.post('/api/auth/logout', body: {'refreshToken': refreshToken});
    } catch (_) {
      // Logout is best-effort; ignore network/expiry errors.
    }
  }

  // ---- Identity / catalog ----

  Future<UserProfile> getMe() async {
    final json = await _client.get('/api/users/me') as Map<String, dynamic>;
    return UserProfile.fromJson(json);
  }

  /// Resolves this app's own catalog id by its [AppConfig.appKey]. Returns null
  /// if no catalog entry with that key exists yet.
  Future<String?> resolveOwnAppId() async {
    final list = await _client.get('/api/apps') as List<dynamic>;
    final items = list.map((e) => AppCatalogItem.fromJson(e as Map<String, dynamic>));
    for (final item in items) {
      if (item.key == AppConfig.appKey) return item.id;
    }
    return null;
  }

  // ---- Settings / limits ----

  Future<ResolvedSettings> getResolvedSettings(String childId, String appId) async {
    final json = await _client
        .get('/api/settings/children/$childId/apps/$appId/resolved') as Map<String, dynamic>;
    return ResolvedSettings.fromJson(json);
  }

  Future<LimitStatus> getLimitStatus(String childId, String appId) async {
    final json = await _client
        .get('/api/usage/children/$childId/apps/$appId/limit-status') as Map<String, dynamic>;
    return LimitStatus.fromJson(json);
  }

  // ---- Usage reporting ----

  Future<void> reportUsage(UsageReport report) async {
    await _client.post('/api/usage/report', body: report.toJson());
  }
}
