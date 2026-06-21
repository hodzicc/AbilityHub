import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/resolved_settings.dart';

/// Parsed view of the free-form preference map the Settings service returns.
/// Keys/values match the web app exactly (see FE/lib/preferences.ts), so a
/// preference a parent sets on the web is reflected here identically.
class AppPreferences {
  final String colorScheme; // default | high-contrast | pastel | warm
  final String fontFamily; // default | rounded | legible
  final String fontSize; // small | medium | large | extra-large
  final bool highContrast;
  final bool reducedMotion;
  final bool soundEnabled;

  AppPreferences({
    required this.colorScheme,
    required this.fontFamily,
    required this.fontSize,
    required this.highContrast,
    required this.reducedMotion,
    required this.soundEnabled,
  });

  factory AppPreferences.fromSettings(ResolvedSettings s) {
    final p = s.preferences;
    bool flag(String key, bool fallback) =>
        p.containsKey(key) ? p[key]!.toLowerCase() == 'true' : fallback;
    return AppPreferences(
      colorScheme: p['colorScheme'] ?? 'default',
      fontFamily: p['fontFamily'] ?? 'default',
      fontSize: p['fontSize'] ?? 'medium',
      highContrast: flag('highContrast', false),
      reducedMotion: flag('reducedMotion', false),
      soundEnabled: flag('soundEnabled', true),
    );
  }

  bool get isHighContrast => highContrast || colorScheme == 'high-contrast';

  /// Larger text is generally easier — scale the whole UI by font-size choice.
  double get textScale {
    switch (fontSize) {
      case 'small':
        return 0.95;
      case 'large':
        return 1.2;
      case 'extra-large':
        return 1.4;
      case 'medium':
      default:
        return 1.1;
    }
  }
}

/// Builds a [ThemeData] from the resolved preferences. The "high contrast" scheme
/// is black-on-yellow (not a plain inversion) per the eye-tracking study cited in
/// ACCESSIBILITY_RESEARCH.md; the "legible" font is Atkinson Hyperlegible.
ThemeData buildTheme(AppPreferences prefs) {
  final base = ThemeData(useMaterial3: true);
  final textTheme = _fontTextTheme(prefs.fontFamily, base.textTheme);

  if (prefs.isHighContrast) {
    const black = Color(0xFF000000);
    const yellow = Color(0xFFFFFF00);
    const scheme = ColorScheme.light(
      primary: black,
      onPrimary: yellow,
      secondary: black,
      onSecondary: yellow,
      surface: yellow,
      onSurface: black,
    );
    return base.copyWith(
      colorScheme: scheme,
      scaffoldBackgroundColor: yellow,
      textTheme: textTheme.apply(bodyColor: black, displayColor: black),
      appBarTheme: const AppBarTheme(backgroundColor: black, foregroundColor: yellow),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: black,
          foregroundColor: yellow,
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
    );
  }

  final seed = _seedColor(prefs.colorScheme);
  return base.copyWith(
    colorScheme: ColorScheme.fromSeed(seedColor: seed),
    textTheme: textTheme,
    appBarTheme: AppBarTheme(backgroundColor: seed, foregroundColor: Colors.white),
  );
}

Color _seedColor(String colorScheme) {
  switch (colorScheme) {
    case 'pastel':
      return const Color(0xFF818CF8);
    case 'warm':
      return const Color(0xFFF97316);
    case 'default':
    default:
      return const Color(0xFF4F46E5);
  }
}

TextTheme _fontTextTheme(String fontFamily, TextTheme base) {
  switch (fontFamily) {
    case 'rounded':
      return GoogleFonts.nunitoTextTheme(base);
    case 'legible':
      return GoogleFonts.atkinsonHyperlegibleTextTheme(base);
    case 'default':
    default:
      return GoogleFonts.interTextTheme(base);
  }
}
