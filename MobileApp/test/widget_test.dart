// Network-free unit tests. (This file also pre-empts the broken counter-app test
// that `flutter create .` would otherwise generate.)

import 'package:flutter_test/flutter_test.dart';
import 'package:abilityhub_mobile/models/resolved_settings.dart';
import 'package:abilityhub_mobile/models/usage_report.dart';
import 'package:abilityhub_mobile/state/preferences_theme.dart';

AppPreferences _prefs({
  String colorScheme = 'default',
  String fontFamily = 'default',
  String fontSize = 'medium',
  bool highContrast = false,
  bool reducedMotion = false,
  bool soundEnabled = true,
}) =>
    AppPreferences(
      colorScheme: colorScheme,
      fontFamily: fontFamily,
      fontSize: fontSize,
      highContrast: highContrast,
      reducedMotion: reducedMotion,
      soundEnabled: soundEnabled,
    );

void main() {
  test('AppPreferences falls back to sensible defaults when prefs are empty', () {
    final prefs = AppPreferences.fromSettings(ResolvedSettings.empty());
    expect(prefs.colorScheme, 'default');
    expect(prefs.fontFamily, 'default');
    expect(prefs.fontSize, 'medium');
    expect(prefs.isHighContrastScheme, false);
  });

  test('AppPreferences reads the same keys the web app writes', () {
    final settings = ResolvedSettings(
      preferences: {'colorScheme': 'high-contrast', 'fontFamily': 'legible', 'fontSize': 'large'},
      dailyTimeLimitMinutes: 60,
      isBlocked: false,
    );
    final prefs = AppPreferences.fromSettings(settings);
    expect(prefs.isHighContrastScheme, true);
    expect(prefs.fontFamily, 'legible');
    expect(prefs.textScale, greaterThan(1.0));
  });

  test('only the high-contrast COLOR SCHEME triggers the black-on-yellow palette', () {
    // buildTheme switches to yellow/black on exactly this flag.
    expect(_prefs(colorScheme: 'high-contrast').isHighContrastScheme, true);
  });

  test('the high-contrast TOGGLE does NOT trigger the yellow/black palette', () {
    // Regression: turning on the boolean toggle previously swapped the whole app
    // to yellow/black. It must only boost contrast within the chosen scheme, so
    // the scheme-decision the theme branches on stays false.
    expect(_prefs(highContrast: true, colorScheme: 'default').isHighContrastScheme, false);
    expect(_prefs(highContrast: true, colorScheme: 'warm').isHighContrastScheme, false);
  });

  test('usage report serializes only the metrics that are provided', () {
    final report = UsageReport(
      applicationId: 'app-1',
      activities: [
        ActivityInput(
          activityType: 'hygiene',
          name: 'Operi ruke',
          occurredAt: DateTime.utc(2026, 6, 20, 10),
          metrics: ActivityMetricsInput(stepsCompleted: 4, stepsTotal: 5),
        ),
      ],
    );
    final json = report.toJson();
    final metrics = (json['activities'] as List).first['metrics'] as Map<String, dynamic>;
    expect(metrics['stepsCompleted'], 4);
    expect(metrics['stepsTotal'], 5);
    expect(metrics.containsKey('hintsShown'), false); // omitted, not null
  });
}
