// Shared constants & helpers for UI preferences (global + per-app overrides).
// Used by the global preferences screen, the child profile "Preferencije" tab,
// and the per-app override panel.

import type { ColorScheme, FontSize, UIPreferences } from '@/lib/types'

export const FONT_SIZES: { value: FontSize; label: string; size: string }[] = [
  { value: 'small',       label: 'Mala',        size: '14px' },
  { value: 'medium',      label: 'Srednja',     size: '16px' },
  { value: 'large',       label: 'Velika',      size: '18px' },
  { value: 'extra-large', label: 'Vrlo velika', size: '20px' },
]

export const COLOR_SCHEMES: { value: ColorScheme; label: string; colors: string[] }[] = [
  { value: 'default',       label: 'Zadana',         colors: ['#4F46E5', '#10B981', '#F59E0B'] },
  { value: 'high-contrast', label: 'Visoki kontrast', colors: ['#000000', '#FFFFFF', '#FF0000'] },
  { value: 'pastel',        label: 'Pastelne',        colors: ['#A5B4FC', '#86EFAC', '#FDE68A'] },
  { value: 'warm',          label: 'Tople',           colors: ['#F97316', '#FBBF24', '#EF4444'] },
]

export const DEFAULT_PREFERENCES: UIPreferences = {
  fontSize: 'medium',
  colorScheme: 'default',
  reducedMotion: false,
  highContrast: false,
  soundEnabled: true,
}

/** UIPreferences -> flat string record, as stored/sent by the Settings service. */
export function prefsToRecord(p: UIPreferences): Record<string, string> {
  return {
    fontSize: p.fontSize,
    colorScheme: p.colorScheme,
    reducedMotion: String(p.reducedMotion),
    highContrast: String(p.highContrast),
    soundEnabled: String(p.soundEnabled),
  }
}

/** Flat string record -> UIPreferences, falling back to provided defaults for missing keys. */
export function recordToPrefs(
  r: Record<string, string>,
  fallback: UIPreferences = DEFAULT_PREFERENCES
): UIPreferences {
  return {
    fontSize: (r.fontSize as FontSize) || fallback.fontSize,
    colorScheme: (r.colorScheme as ColorScheme) || fallback.colorScheme,
    reducedMotion: r.reducedMotion !== undefined ? r.reducedMotion === 'true' : fallback.reducedMotion,
    highContrast: r.highContrast !== undefined ? r.highContrast === 'true' : fallback.highContrast,
    soundEnabled: r.soundEnabled !== undefined ? r.soundEnabled !== 'false' : fallback.soundEnabled,
  }
}

/** Merge global preferences with a (possibly partial/empty) per-app override record. */
export function resolvePrefs(global: UIPreferences, override: Record<string, string>): UIPreferences {
  if (!override || Object.keys(override).length === 0) return global
  return recordToPrefs({ ...prefsToRecord(global), ...override }, global)
}

/** Human-readable label for a single preference key's current value — used in summary tables. */
export function labelFor(key: keyof UIPreferences, prefs: UIPreferences): string {
  switch (key) {
    case 'fontSize':
      return FONT_SIZES.find(f => f.value === prefs.fontSize)?.label ?? prefs.fontSize
    case 'colorScheme':
      return COLOR_SCHEMES.find(c => c.value === prefs.colorScheme)?.label ?? prefs.colorScheme
    case 'reducedMotion':
      return prefs.reducedMotion ? 'Uključeno' : 'Isključeno'
    case 'highContrast':
      return prefs.highContrast ? 'Uključeno' : 'Isključeno'
    case 'soundEnabled':
      return prefs.soundEnabled ? 'Uključeno' : 'Isključeno'
    default:
      return ''
  }
}
