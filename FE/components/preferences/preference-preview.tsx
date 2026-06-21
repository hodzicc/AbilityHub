'use client'

import { cn } from '@/lib/utils'
import { COLOR_SCHEMES, FONT_FAMILIES, FONT_SIZES } from '@/lib/preferences'
import { useTranslation } from '@/components/providers'
import type { UIPreferences } from '@/lib/types'

interface PreferencePreviewProps {
  preferences: UIPreferences
  /** Smaller mockup for use inside per-app override panels. */
  compact?: boolean
  className?: string
  /** Which device chrome to render the same preferences inside. Defaults to 'mobile'. */
  platform?: 'mobile' | 'web'
}

/**
 * Live mock-device preview that reflects the given preferences in real time.
 * Used on the global preferences screen, the child profile "Preferencije" tab,
 * and the per-app override panel — so a guardian always sees the effect of a
 * change before saving it. Renders the same content inside either a phone or
 * a browser-window chrome depending on `platform`, since apps can be mobile
 * or web.
 */
export function PreferencePreview({ preferences, compact = false, className, platform = 'mobile' }: PreferencePreviewProps) {
  const { t } = useTranslation()
  const isWeb = platform === 'web'
  const maxWidth = isWeb
    ? (compact ? 'max-w-[300px]' : 'max-w-[420px]')
    : (compact ? 'max-w-[200px]' : 'max-w-[260px]')
  const minHeight = compact ? 'min-h-[280px]' : 'min-h-[380px]'

  const content = (
    <div
      className={cn(
        'p-4 text-gray-900',
        minHeight,
        // High-contrast preview uses the black-on-yellow combination, which
        // gives the strongest possible visual contrast — not a generic
        // black/white invert. The mockup's own backgrounds are always light,
        // regardless of the app's light/dark theme, so its text color is
        // pinned to a dark shade rather than inheriting the (possibly white)
        // ambient foreground color.
        preferences.colorScheme === 'default' && 'bg-white',
        preferences.colorScheme === 'high-contrast' && 'bg-yellow-300 text-black',
        preferences.colorScheme === 'pastel' && 'bg-indigo-50',
        preferences.colorScheme === 'warm' && 'bg-orange-50'
      )}
      style={{
        fontSize: FONT_SIZES.find(f => f.value === preferences.fontSize)?.size,
        fontFamily: FONT_FAMILIES.find(f => f.value === preferences.fontFamily)?.stack,
      }}
    >
      <div className={cn(
        'rounded-lg p-3 mb-4',
        // The 'highContrast' boolean (independent of colorScheme — it's the
        // "increase text and element contrast" accessibility toggle, not
        // the high-contrast color palette) outlines every element with a
        // ring so it produces a visible effect under any palette, without
        // colliding with the border-color classes colorScheme sets below.
        preferences.highContrast && 'ring-2 ring-gray-900 dark:ring-white',
        preferences.colorScheme === 'default' && 'bg-indigo-500',
        preferences.colorScheme === 'high-contrast' && 'bg-black text-yellow-300',
        preferences.colorScheme === 'pastel' && 'bg-indigo-400',
        preferences.colorScheme === 'warm' && 'bg-orange-400'
      )}>
        <span className={cn('font-bold', preferences.colorScheme !== 'high-contrast' && 'text-white')}>
          {t('settings.previewAppName')}
        </span>
      </div>
      <div className={cn('space-y-4', isWeb && 'grid grid-cols-2 gap-4 space-y-0 items-start')}>
        <div className={cn('rounded-xl p-6 text-center',
          preferences.highContrast && 'ring-2 ring-gray-900',
          preferences.colorScheme === 'default' && 'bg-indigo-100',
          preferences.colorScheme === 'high-contrast' && 'bg-yellow-300 border-2 border-black',
          preferences.colorScheme === 'pastel' && 'bg-indigo-100',
          preferences.colorScheme === 'warm' && 'bg-orange-100'
        )}>
          <span
            className={cn('text-6xl', preferences.highContrast ? 'font-extrabold' : 'font-bold')}
            style={{ color: COLOR_SCHEMES.find(c => c.value === preferences.colorScheme)?.accentText }}
          >A</span>
        </div>
        <div className="space-y-4">
          <p className={cn('text-center', preferences.highContrast && 'font-bold underline')}>
            {t('settings.previewFindLetter')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {['A', 'B', 'C'].map(letter => (
              <button key={letter} className={cn(
                'rounded-lg p-3 font-bold transition-transform',
                !preferences.reducedMotion && 'hover:scale-105',
                preferences.highContrast && 'ring-2 ring-gray-900',
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
    </div>
  )

  return (
    <div className={cn('mx-auto', maxWidth, className)}>
      {isWeb ? (
        <div className="rounded-lg border-4 border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xl">
          <div className="bg-gray-800 px-3 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <div className="ml-2 flex-1 rounded-md bg-gray-700 px-2 py-0.5 text-[10px] text-gray-300 truncate">
              app.abilityhub.local
            </div>
          </div>
          {content}
        </div>
      ) : (
        <div className="rounded-[2rem] border-8 border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xl">
          <div className="bg-gray-800 text-white text-xs py-1 px-4 flex justify-between">
            <span>9:41</span><span>100%</span>
          </div>
          {content}
          <div className="bg-gray-800 py-2 flex justify-center">
            <div className="w-24 h-1 bg-gray-600 rounded-full" />
          </div>
        </div>
      )}
    </div>
  )
}
