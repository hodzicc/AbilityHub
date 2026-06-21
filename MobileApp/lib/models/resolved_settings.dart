/// Mirrors the Settings service `ResolvedSettingsResponse`: what this app should
/// apply for the signed-in child — merged preferences plus the restriction.
class ResolvedSettings {
  final Map<String, String> preferences;
  final int? dailyTimeLimitMinutes;
  final bool isBlocked;

  ResolvedSettings({
    required this.preferences,
    required this.dailyTimeLimitMinutes,
    required this.isBlocked,
  });

  factory ResolvedSettings.fromJson(Map<String, dynamic> json) {
    final prefsRaw = (json['preferences'] as Map<String, dynamic>?) ?? {};
    final restriction = (json['restriction'] as Map<String, dynamic>?) ?? {};
    return ResolvedSettings(
      preferences: prefsRaw.map((k, v) => MapEntry(k, v?.toString() ?? '')),
      dailyTimeLimitMinutes: restriction['dailyTimeLimitMinutes'] as int?,
      isBlocked: restriction['isBlocked'] as bool? ?? false,
    );
  }

  static ResolvedSettings empty() =>
      ResolvedSettings(preferences: const {}, dailyTimeLimitMinutes: null, isBlocked: false);
}
