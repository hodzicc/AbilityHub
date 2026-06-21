import 'package:shared_preferences/shared_preferences.dart';

/// Persists the access/refresh token pair across launches.
///
/// NOTE: SharedPreferences is plain on-device storage — fine for a reference/demo
/// app. A production build should use flutter_secure_storage (Keychain/Keystore).
class TokenStore {
  static const _accessKey = 'ah_access_token';
  static const _refreshKey = 'ah_refresh_token';

  String? accessToken;
  String? refreshToken;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    accessToken = prefs.getString(_accessKey);
    refreshToken = prefs.getString(_refreshKey);
  }

  Future<void> save(String access, String refresh) async {
    accessToken = access;
    refreshToken = refresh;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessKey, access);
    await prefs.setString(_refreshKey, refresh);
  }

  Future<void> clear() async {
    accessToken = null;
    refreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessKey);
    await prefs.remove(_refreshKey);
  }

  bool get hasSession => (accessToken?.isNotEmpty ?? false);
}
