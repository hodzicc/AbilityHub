'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { useTranslation, useLanguage } from '@/components/providers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Activity } from 'lucide-react'
import { apiGetCombinedDailyMetrics } from '@/lib/api'
import { WeekNav, weekRange } from './week-nav'

interface Props {
  /** Children whose metrics are summed for the chart (one or many). */
  childIds: string[]
  /** App-id filter: null = all apps; [] = a category with no apps (renders empty). */
  applicationIds: string[] | null
  /** Bumped by the parent on each realtime usage change to force a re-fetch. */
  reloadKey?: number
}

interface DayPoint {
  label: string
  hints: number
  completed: number
  notCompleted: number
  stepBacks: number
}

// Distinct colours AND dash patterns so series that land on the same value (e.g.
// hints and mistakes both 2 on a day) stay individually readable instead of one
// line hiding under another.
const SERIES = [
  { key: 'completed', color: '#10b981', dash: undefined },
  { key: 'notCompleted', color: '#f43f5e', dash: '6 3' },
  { key: 'hints', color: '#f59e0b', dash: '2 3' },
  { key: 'stepBacks', color: '#8b5cf6', dash: '1 4' },
] as const

/**
 * Per-day activity outcomes over a 7-day window with its own week navigation:
 * completed, not completed, hints shown and "step-backs" (the former "errors" —
 * wrong selections / skipped steps / returning to a previous step). Replaces the
 * old usage pie chart.
 */
export function ActivityMetricsChart({ childIds, applicationIds, reloadKey }: Props) {
  const { t } = useTranslation()
  const { locale } = useLanguage()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const axisColor = isDark ? '#cbd5e1' : '#475569'
  const gridColor = isDark ? '#334155' : '#e2e8f0'
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const tooltipText = isDark ? '#f1f5f9' : '#0f172a'

  const [offset, setOffset] = useState(0)
  const [data, setData] = useState<DayPoint[]>([])
  const [rangeLabel, setRangeLabel] = useState('')
  const range = useMemo(() => weekRange(offset), [offset])
  // Series hidden via the clickable legend — lets a parent isolate e.g. just
  // "completed" or just "not completed" instead of reading all four lines at once.
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set())
  const toggleSeries = (key: string) => {
    setHiddenSeries(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  useEffect(() => {
    // A category that resolves to no apps → nothing to show.
    if (childIds.length === 0 || (applicationIds !== null && applicationIds.length === 0)) {
      setData([])
      return
    }
    let active = true
    const loc = locale === 'bs' ? 'bs-BA' : 'en-US'
    const appIds = applicationIds ?? undefined
    // One backend call returns per-day outcome counts already summed across the children.
    apiGetCombinedDailyMetrics(childIds, appIds, range).catch(() => null)
      .then(res => {
        if (!active) return
        if (!res) { setData([]); return }
        const points: DayPoint[] = res.days.map(d => ({
          label: new Date(d.date).toLocaleDateString(loc, { weekday: 'short', day: 'numeric' }),
          hints: d.hints,
          completed: d.completed,
          notCompleted: d.notCompleted,
          stepBacks: d.stepBacks,
        }))
        setData(points)
        const fmt = (iso: string) => new Date(iso).toLocaleDateString(loc, { day: 'numeric', month: 'short' })
        setRangeLabel(`${fmt(res.rangeStart)} – ${fmt(res.rangeEnd)}`)
      })
    return () => { active = false }
  }, [childIds, applicationIds, range, locale, reloadKey])

  const hasData = data.some(d => d.hints || d.completed || d.notCompleted || d.stepBacks)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">{t('statistics.activityOutcomes')}</CardTitle>
        <WeekNav offset={offset} onChange={setOffset} rangeLabel={rangeLabel} />
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="w-full">
            <p className="mb-2 text-xs text-muted-foreground">{t('statistics.activityOutcomesLegendHint')}</p>
            <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', color: tooltipText }}
                  labelStyle={{ color: tooltipText }}
                  itemStyle={{ color: tooltipText }}
                />
                <Legend
                  wrapperStyle={{ color: axisColor, fontSize: 12, cursor: 'pointer' }}
                  onClick={(e) => { if (e?.dataKey) toggleSeries(String(e.dataKey)) }}
                  formatter={(value, entry) => {
                    const key = (entry as { dataKey?: string })?.dataKey ?? ''
                    const isHidden = hiddenSeries.has(key)
                    return (
                      <span style={{ opacity: isHidden ? 0.4 : 1, textDecoration: isHidden ? 'line-through' : 'none' }}>
                        {value}
                      </span>
                    )
                  }}
                />
                {SERIES.map(s => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={t(`statistics.outcomes.${s.key}`)}
                    stroke={s.color}
                    strokeWidth={2}
                    strokeDasharray={s.dash}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                    hide={hiddenSeries.has(s.key)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex h-[280px] items-center justify-center">
            <EmptyState icon={Activity} title={t('statistics.noOutcomesYet')} description={t('statistics.noOutcomesYetDesc')} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
