'use client'

import { cn } from '@/lib/utils'
import { COLOR_SCHEMES, FONT_SIZES } from '@/lib/preferences'
import { useTranslation } from '@/components/providers'
import type { UIPreferences } from '@/lib/types'

interface PreferencePreviewProps {
  preferences: UIPreferences
  /** Smaller phone mockup for use inside per-app override panels. */
  compact?: boolean
  className?: string
}

/**
 * Live mock-phone preview that reflects the given preferences in real time.
 * Used on the global preferences screen, the child profile "Preferencije" tab,
 * and the per-app override panel — so a guardian always sees the effect of a
 * change before saving it.
 */
export function PreferencePreview({ preferences, compact = false, className }: PreferencePreviewProps) {
  const { t } = useTranslation()
  const maxWidth = compact ? 'max-w-[200px]' : 'max-w-[260px]'
  const minHeight = compact ? 'min-h-[280px]' : 'min-h-[380px]'

  return (
    <div className={cn('mx-auto', maxWidth, className)}>
      <div className="rounded-[2rem] border-8 border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xl">
        <div className="bg-gray-800 text-white text-xs py-1 px-4 flex justify-between">
          <span>9:41</span><span>100%</span>
        </div>
        <div
          className={cn(
            'p-4',
            minHeight,
            // High-contrast preview uses the black-on-yellow combination
            // (#000000 on #FFFF00) shown by Alonso-Virgós et al. (2018) to
            // maximize sustained attention for users with Down syndrome —
            // see ACCESSIBILITY_RESEARCH.md — not a generic black/white invert.
            preferences.colorScheme === 'high-contrast' && 'bg-yellow-300 text-black',
            preferences.colorScheme === 'pastel' && 'bg-indigo-50',
            preferences.colorScheme === 'warm' && 'bg-orange-50'
          )}
          style={{ fontSize: FONT_SIZES.find(f => f.value === preferences.fontSize)?.size }}
        >
          <div className={cn(
            'rounded-lg p-3 mb-4',
            preferences.colorScheme === 'default' && 'bg-indigo-500',
            preferences.colorScheme === 'high-contrast' && 'bg-black text-yellow-300',
            preferences.colorScheme === 'pastel' && 'bg-indigo-200',
            preferences.colorScheme === 'warm' && 'bg-orange-400'
          )}>
            <span className={cn('font-bold', preferences.colorScheme !== 'high-contrast' && 'text-white')}>
              {t('settings.previewAppName')}
            </span>
          </div>
          <div className="space-y-4">
            <div className={cn('rounded-xl p-6 text-center',
              preferences.colorScheme === 'default' && 'bg-indigo-100',
              preferences.colorScheme === 'high-contrast' && 'bg-yellow-300 border-2 border-black',
              preferences.colorScheme === 'pastel' && 'bg-indigo-100',
              preferences.colorScheme === 'warm' && 'bg-orange-100'
            )}>
              <span
                className="text-6xl font-bold"
                style={{
                  color: preferences.colorScheme === 'high-contrast'
                    ? '#000000'
                    : COLOR_SCHEMES.find(c => c.value === preferences.colorScheme)?.colors[0],
                }}
              >A</span>
            </div>
            <p className={cn('text-center', preferences.highContrast && 'font-bold')}>
              {t('settings.previewFindLetter')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {['A', 'B', 'C'].map(letter => (
                <button key={letter} className={cn(
                  'rounded-lg p-3 font-bold transition-transform',
                  !preferences.reducedMotion && 'hover:scale-105',
                  preferences.colorScheme === 'default' && 'bg-gray-100',
                  preferences.colorScheme === 'high-contrast' && 'bg-black text-yellow-300 border-2 border-black',
                  preferences.colorScheme === 'pastel' && 'bg-white',
                  preferences.colorScheme === 'warm' && 'bg-white'
                )}>
                  {letter}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-gray-800 py-2 flex justify-center">
          <div className="w-24 h-1 bg-gray-600 rounded-full" />
        </div>
      </div>
    </div>
  )
}
