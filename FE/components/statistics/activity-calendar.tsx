'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '@/components/providers'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { ACTIVITY_ICONS, resolveActivityAction, describeActivity } from '@/lib/activity'
import { apiGetCalendarMonth, apiGetActivitiesOnDate, type RecentActivityDto } from '@/lib/api'
import { cn } from '@/lib/utils'

interface ActivityCalendarProps {
  childIds: string[]
  applicationIds: string[] | null
  appNames: Record<string, { name: string; color: string }>
}

const pad = (n: number) => String(n).padStart(2, '0')
/** Local-date key (YYYY-MM-DD) — matches the day the backend groups OccurredAt by. */
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/**
 * A normal month calendar (prev/next navigation, Monday-first grid) instead of the
 * old GitHub-style 90-day heatmap — clicking a day lists everything assigned to the
 * child(ren) that day, including days in the past.
 */
export function ActivityCalendar({ childIds, applicationIds, appNames }: ActivityCalendarProps) {
  const { t, locale } = useTranslation()
  const localeTag = locale === 'bs' ? 'bs-BA' : 'en-US'

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set())
  const [isLoadingMonth, setIsLoadingMonth] = useState(false)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayActivities, setDayActivities] = useState<RecentActivityDto[]>([])
  const [isLoadingDay, setIsLoadingDay] = useState(false)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth() + 1 // 1-12, matches the backend's convention

  useEffect(() => {
    if (childIds.length === 0 || (applicationIds !== null && applicationIds.length === 0)) {
      setActiveDays(new Set())
      return
    }
    let active = true
    setIsLoadingMonth(true)
    const appIds = applicationIds ?? undefined
    Promise.all(childIds.map(id => apiGetCalendarMonth(id, year, month, appIds).catch(() => null)))
      .then(results => {
        if (!active) return
        const days = new Set<string>()
        results.forEach(r => r?.activeDays.forEach(d => days.add(d.slice(0, 10))))
        setActiveDays(days)
      })
      .finally(() => { if (active) setIsLoadingMonth(false) })
    return () => { active = false }
  }, [childIds, applicationIds, year, month])

  const openDay = (date: Date) => {
    const key = dateKey(date)
    setSelectedDate(key)
    if (childIds.length === 0) { setDayActivities([]); return }
    setIsLoadingDay(true)
    const appIds = applicationIds ?? undefined
    Promise.all(childIds.map(id => apiGetActivitiesOnDate(id, key, appIds).catch(() => [] as RecentActivityDto[])))
      .then(results => {
        const all = results.flat().sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
        setDayActivities(all)
      })
      .finally(() => setIsLoadingDay(false))
  }

  // Monday-first grid: leading/trailing blanks so the month lines up under weekday headers.
  const weeks = useMemo(() => {
    const first = new Date(year, month - 1, 1)
    const daysInMonth = new Date(year, month, 0).getDate()
    const leadingBlanks = (first.getDay() + 6) % 7 // Mon=0 ... Sun=6
    const cells: (Date | null)[] = Array(leadingBlanks).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month - 1, d))
    while (cells.length % 7 !== 0) cells.push(null)
    const result: (Date | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7))
    return result
  }, [year, month])

  const weekdayLabels = useMemo(() => {
    const ref = new Date(2024, 0, 1) // a Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ref)
      d.setDate(d.getDate() + i)
      return d.toLocaleDateString(localeTag, { weekday: 'short' })
    })
  }, [localeTag])

  const monthLabel = viewDate.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })
  const todayKey = dateKey(new Date())

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium capitalize">{monthLabel}</span>
        <div className="flex items-center gap-1.5">
          {isLoadingMonth && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <Button
            variant="outline" size="icon" className="h-7 w-7"
            onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            aria-label={t('statistics.previousMonth')} title={t('statistics.previousMonth')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline" size="icon" className="h-7 w-7"
            onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            aria-label={t('statistics.nextMonth')} title={t('statistics.nextMonth')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {weekdayLabels.map(l => <div key={l}>{l}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((date, i) => {
          if (!date) return <div key={i} />
          const key = dateKey(date)
          const active = activeDays.has(key)
          const isToday = key === todayKey
          return (
            <button
              key={i}
              type="button"
              onClick={() => openDay(date)}
              className={cn(
                'flex h-9 items-center justify-center rounded-lg text-sm transition-colors hover:bg-accent',
                active && 'bg-indigo-100 font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
                isToday && 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-background'
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">{t('statistics.activityCalendarNote')}</p>

      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString(localeTag, {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </DialogTitle>
          </DialogHeader>
          {isLoadingDay ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('statistics.loadingActivities')}
            </div>
          ) : dayActivities.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('statistics.noActivitiesOnDay')}</p>
          ) : (
            <div className="max-h-[400px] space-y-3 overflow-y-auto">
              {dayActivities.map((activity, i) => {
                const app = appNames[activity.applicationId]
                const action = resolveActivityAction(activity.activityType, activity.inProgress)
                const Icon = ACTIVITY_ICONS[action]
                const description = describeActivity(activity, t)
                return (
                  <div key={activity.id ?? i} className="flex items-start gap-3 rounded-lg border p-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: (app?.color ?? '#666') + '20', color: app?.color ?? '#666' }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{activity.name}</span>
                        <Badge variant="secondary" className="text-xs">{app?.name ?? t('common.unknown')}</Badge>
                      </div>
                      {description !== activity.name && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(activity.occurredAt).toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
