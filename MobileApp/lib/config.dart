import 'package:flutter_dotenv/flutter_dotenv.dart';

/// App configuration, read from the bundled `.env` file at runtime (see
/// `MobileApp/.env`). A `--dart-define` of the same name still wins if provided,
/// so CI/builds can override the file without editing it. The literal fallbacks
/// are only a last resort if neither is set.
class AppConfig {
  /// Base URL of the AbilityHub API gateway.
  static String get apiBaseUrl => _read('API_BASE_URL', 'http://10.0.2.2:8080');

  /// Catalog `key` of this app — the real catalog id (GUID) is looked up by it.
  static String get appKey => _read('APP_KEY', 'reference-mobile');

  static String _read(String key, String fallback) {
    // 1) build-time override (--dart-define=KEY=value)
    final fromDefine = _fromDefine(key);
    if (fromDefine != null && fromDefine.isNotEmpty) return fromDefine;
    // 2) the .env file
    if (dotenv.isInitialized) {
      final v = dotenv.env[key];
      if (v != null && v.isNotEmpty) return v;
    }
    // 3) last-resort default
    return fallback;
  }

  static String? _fromDefine(String key) {
    switch (key) {
      case 'API_BASE_URL':
        const v = String.fromEnvironment('API_BASE_URL');
        return v.isEmpty ? null : v;
      case 'APP_KEY':
        const v = String.fromEnvironment('APP_KEY');
        return v.isEmpty ? null : v;
      default:
        return null;
    }
  }
}
