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
import { apiGetDailyMetrics } from '@/lib/api'
import { WeekNav, weekRange } from './week-nav'

interface Props {
  /** Children whose metrics are summed for the chart (one or many). */
  childIds: string[]
  /** App-id filter: null = all apps; [] = a category with no apps (renders empty). */
  applicationIds: string[] | null
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
export function ActivityMetricsChart({ childIds, applicationIds }: Props) {
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

  useEffect(() => {
    // A category that resolves to no apps → nothing to show.
    if (childIds.length === 0 || (applicationIds !== null && applicationIds.length === 0)) {
      setData([])
      return
    }
    let active = true
    const loc = locale === 'bs' ? 'bs-BA' : 'en-US'
    const appIds = applicationIds ?? undefined
    Promise.all(childIds.map(id => apiGetDailyMetrics(id, appIds, range).catch(() => null)))
      .then(results => {
        if (!active) return
        const valid = results.filter(Boolean) as NonNullable<typeof results[number]>[]
        if (valid.length === 0) { setData([]); return }
        // Every response covers the same window, so sum element-wise by day index.
        const dayCount = valid[0].days.length
        const points: DayPoint[] = []
        for (let i = 0; i < dayCount; i++) {
          const date = valid[0].days[i].date
          points.push({
            label: new Date(date).toLocaleDateString(loc, { weekday: 'short', day: 'numeric' }),
            hints: valid.reduce((s, r) => s + (r.days[i]?.hints ?? 0), 0),
            completed: valid.reduce((s, r) => s + (r.days[i]?.completed ?? 0), 0),
            notCompleted: valid.reduce((s, r) => s + (r.days[i]?.notCompleted ?? 0), 0),
            stepBacks: valid.reduce((s, r) => s + (r.days[i]?.stepBacks ?? 0), 0),
          })
        }
        setData(points)
        const fmt = (iso: string) => new Date(iso).toLocaleDateString(loc, { day: 'numeric', month: 'short' })
        setRangeLabel(`${fmt(valid[0].rangeStart)} – ${fmt(valid[0].rangeEnd)}`)
      })
    return () => { active = false }
  }, [childIds, applicationIds, range, locale])

  const hasData = data.some(d => d.hints || d.completed || d.notCompleted || d.stepBacks)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">{t('statistics.activityOutcomes')}</CardTitle>
        <WeekNav offset={offset} onChange={setOffset} rangeLabel={rangeLabel} />
      </CardHeader>
      <CardContent>
        {hasData ? (
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
                <Legend wrapperStyle={{ color: axisColor, fontSize: 12 }} />
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
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
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
