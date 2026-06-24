'use client'

import { useMemo } from 'react'
import { useTranslation } from '@/components/providers'

interface ActivityHeatmapProps {
  /** ISO date strings (or date-like strings) on which the child completed any activity. */
  activeDays: string[]
  /** Accent color used for active cells — typically the child's colorScheme.accentText. */
  color: string
  /** Fill for days with no activity — visible grey, passed in so it can be theme-aware. */
  emptyColor: string
  /** How many trailing days to render. Defaults to 90 (~13 weeks). */
  days?: number
}

type Day = { date: Date; active: boolean } | null

const CELL = 15 // px — square cell side
const GAP = 4 // px — gap between cells

/**
 * GitHub-contributions-style calendar: one column per week, one row per weekday,
 * filled cells mark days the child completed at least one activity. Fixed-size
 * square cells, month labels above each month's first column, weekday labels down
 * the left, and a legend explaining the two states.
 */
export function ActivityHeatmap({ activeDays, color, emptyColor, days = 90 }: ActivityHeatmapProps) {
  const { t, locale } = useTranslation()
  const localeTag = locale === 'bs' ? 'bs-BA' : 'en-US'

  const activeDateSet = useMemo(
    () => new Set(activeDays.map(d => new Date(d).toDateString())),
    [activeDays]
  )

  // Weeks (oldest → newest), each a 7-slot column starting on Sunday. The first
  // week is front-padded with nulls so weekday rows line up.
  const weeks = useMemo<Day[][]>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const flat: Day[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      flat.push({ date, active: activeDateSet.has(date.toDateString()) })
    }
    const lead = (flat[0] as Exclude<Day, null>).date.getDay()
    const padded: Day[] = Array<Day>(lead).fill(null).concat(flat)
    const result: Day[][] = []
    for (let i = 0; i < padded.length; i += 7) result.push(padded.slice(i, i + 7))
    return result
  }, [activeDateSet, days])

  // For each week column, the month name to show when that week introduces a new month.
  const monthLabels = useMemo(() => {
    let last = -1
    return weeks.map(week => {
      const firstReal = week.find((d): d is Exclude<Day, null> => d !== null)
      if (!firstReal) return ''
      const m = firstReal.date.getMonth()
      if (m !== last) {
        last = m
        return firstReal.date.toLocaleDateString(localeTag, { month: 'short' })
      }
      return ''
    })
  }, [weeks, localeTag])

  const weekdayLabels = useMemo(() => {
    // Mon / Wed / Fri (rows 1, 3, 5), like GitHub.
    const ref = new Date(2024, 0, 7) // a Sunday
    const fmt = (offset: number) => {
      const d = new Date(ref)
      d.setDate(d.getDate() + offset)
      return d.toLocaleDateString(localeTag, { weekday: 'short' })
    }
    return { 1: fmt(1), 3: fmt(3), 5: fmt(5) } as Record<number, string>
  }, [localeTag])

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {/* Weekday labels */}
        <div className="flex shrink-0 flex-col pt-[19px]" style={{ gap: GAP }}>
          {[0, 1, 2, 3, 4, 5, 6].map(row => (
            <div
              key={row}
              className="flex items-center pr-1 text-[11px] leading-none text-muted-foreground"
              style={{ height: CELL }}
            >
              {weekdayLabels[row] ?? ''}
            </div>
          ))}
        </div>

        {/* Week columns */}
        <div className="flex shrink-0" style={{ gap: GAP }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
              <div className="h-[15px] whitespace-nowrap text-[11px] leading-[15px] text-muted-foreground">
                {monthLabels[wi]}
              </div>
              {week.map((day, di) => (
                <div
                  key={di}
                  role={day ? 'img' : undefined}
                  aria-label={
                    day
                      ? `${day.date.toLocaleDateString(localeTag, { day: 'numeric', month: 'short', year: 'numeric' })}: ${
                          day.active ? t('statistics.heatmapActiveDay') : t('statistics.heatmapInactiveDay')
                        }`
                      : undefined
                  }
                  title={day ? day.date.toLocaleDateString(localeTag, { day: 'numeric', month: 'short', year: 'numeric' }) : undefined}
                  className="rounded-[3px]"
                  style={{
                    width: CELL,
                    height: CELL,
                    backgroundColor: !day ? 'transparent' : day.active ? color : emptyColor,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="rounded-[3px]" style={{ width: CELL, height: CELL, backgroundColor: emptyColor }} />
          {t('statistics.heatmapInactiveDay')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded-[3px]" style={{ width: CELL, height: CELL, backgroundColor: color }} />
          {t('statistics.heatmapActiveDay')}
        </span>
      </div>
    </div>
  )
}
