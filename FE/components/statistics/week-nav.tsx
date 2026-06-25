'use client'

import { useTranslation } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// 7-day window navigation shared by the per-chart navigators. Offset 0 = current
// week; each step pages back 7 days, capped so the start stays within the backend's
// 90-day lookback.
export const WINDOW_DAYS = 7
export const MAX_WEEK_OFFSET = 11

/** ISO (YYYY-MM-DD) from/to for the 7-day window `offset` weeks before today. */
export function weekRange(offset: number): { from: string; to: string } {
  const end = new Date()
  end.setUTCHours(0, 0, 0, 0)
  end.setUTCDate(end.getUTCDate() - offset * WINDOW_DAYS)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - (WINDOW_DAYS - 1))
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { from: iso(start), to: iso(end) }
}

/** Compact previous/this/next week control with the active date range label. */
export function WeekNav({
  offset,
  onChange,
  rangeLabel,
}: {
  offset: number
  onChange: (offset: number) => void
  rangeLabel: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-1.5">
      <span className="hidden text-xs text-muted-foreground sm:inline">{rangeLabel}</span>
      <Badge variant="secondary" className="text-[10px]">{t('statistics.sevenDayWindow')}</Badge>
      <Button
        variant="outline" size="icon" className="h-7 w-7"
        onClick={() => onChange(Math.min(MAX_WEEK_OFFSET, offset + 1))}
        disabled={offset >= MAX_WEEK_OFFSET}
        aria-label={t('statistics.previousWeek')} title={t('statistics.previousWeek')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline" size="icon" className="h-7 w-7"
        onClick={() => onChange(Math.max(0, offset - 1))}
        disabled={offset === 0}
        aria-label={t('statistics.nextWeek')} title={t('statistics.nextWeek')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
