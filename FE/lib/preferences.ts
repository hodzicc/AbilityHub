// Shared constants & helpers for UI preferences (global + per-app overrides).
// Used by the global preferences screen, the child profile "Preferencije" tab,
// and the per-app override panel.

import type { ColorScheme, FontFamily, FontSize, UIPreferences } from '@/lib/types'

export const FONT_SIZES: { value: FontSize; label: string; size: string }[] = [
  { value: 'small',       label: 'Mala',        size: '14px' },
  { value: 'medium',      label: 'Srednja',     size: '16px' },
  { value: 'large',       label: 'Velika',      size: '18px' },
  { value: 'extra-large', label: 'Vrlo velika', size: '20px' },
]

// Font choices: a default rounded sans for friendliness, and a high-legibility
// option (wider letterforms, simple shapes) for readers with cognitive
// accessibility needs. See ACCESSIBILITY_RESEARCH.md for sourcing.
export const FONT_FAMILIES: { value: FontFamily; label: string; stack: string }[] = [
  { value: 'default', label: 'Standardni (Inter)',        stack: 'var(--font-sans, ui-sans-serif), system-ui, sans-serif' },
  { value: 'rounded',  label: 'Zaokruženi (Nunito)',       stack: '"Nunito", var(--font-sans, ui-sans-serif), sans-serif' },
  { value: 'legible',  label: 'Visoka čitljivost (Atkinson)', stack: '"Atkinson Hyperlegible", var(--font-sans, ui-sans-serif), sans-serif' },
]

// Color scheme palette — see ACCESSIBILITY_RESEARCH.md for sourcing.
// "high-contrast" uses a black-on-yellow pairing rather than a plain
// black/white inversion; "default", "pastel", and "warm" are general
// preference alternatives.
export const COLOR_SCHEMES: { value: ColorScheme; label: string; colors: string[] }[] = [
  { value: 'default',       label: 'Zadana',         colors: ['#4F46E5', '#10B981', '#F59E0B'] },
  { value: 'high-contrast', label: 'Visoki kontrast (žuto-crna)', colors: ['#000000', '#FFFF00', '#1D4ED8'] },
  { value: 'pastel',        label: 'Pastelne',        colors: ['#A5B4FC', '#86EFAC', '#FDE68A'] },
  { value: 'warm',          label: 'Tople',           colors: ['#F97316', '#FBBF24', '#EF4444'] },
]

export const DEFAULT_PREFERENCES: UIPreferences = {
  fontSize: 'medium',
  colorScheme: 'default',
  fontFamily: 'default',
  reducedMotion: false,
  highContrast: false,
  soundEnabled: true,
}

/** UIPreferences -> flat string record, as stored/sent by the Settings service. */
export function prefsToRecord(p: UIPreferences): Record<string, string> {
  return {
    fontSize: p.fontSize,
    colorScheme: p.colorScheme,
    fontFamily: p.fontFamily,
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
    fontFamily: (r.fontFamily as FontFamily) || fallback.fontFamily,
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
    case 'fontFamily':
      return FONT_FAMILIES.find(f => f.value === prefs.fontFamily)?.label ?? prefs.fontFamily
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
