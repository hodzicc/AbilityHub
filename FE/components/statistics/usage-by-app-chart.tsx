'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { useTranslation, useLanguage } from '@/components/providers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { apiGetDashboard } from '@/lib/api'
import { DEFAULT_APP_COLOR } from '@/lib/constants'
import { WeekNav, weekRange } from './week-nav'

interface Props {
  childIds: string[]
  applicationIds: string[] | null
  appNames: Record<string, { name: string; color: string }>
  /** Bumped by the parent on each realtime usage change to force a re-fetch. */
  reloadKey?: number
}

interface AppBar {
  name: string
  usage: number
  color: string
}

/** Total usage minutes per application over a 7-day window, with its own week nav. */
export function UsageByAppChart({ childIds, applicationIds, appNames, reloadKey }: Props) {
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
  const [bars, setBars] = useState<AppBar[]>([])
  const [rangeLabel, setRangeLabel] = useState('')
  const range = useMemo(() => weekRange(offset), [offset])

  useEffect(() => {
    if (childIds.length === 0 || (applicationIds !== null && applicationIds.length === 0)) {
      setBars([])
      return
    }
    let active = true
    const loc = locale === 'bs' ? 'bs-BA' : 'en-US'
    const appIds = applicationIds ?? undefined
    Promise.all(childIds.map(id => apiGetDashboard(id, appIds, range).catch(() => null)))
      .then(results => {
        if (!active) return
        const valid = results.filter(Boolean) as NonNullable<typeof results[number]>[]
        // Sum minutes per app id across the displayed children.
        const totals = new Map<string, number>()
        valid.forEach(d => d.perApp.forEach(a => totals.set(a.applicationId, (totals.get(a.applicationId) ?? 0) + a.totalMinutes)))
        const next = Array.from(totals.entries())
          .map(([id, usage]) => ({
            name: (appNames[id]?.name ?? t('common.unknown')).slice(0, 12),
            usage,
            color: appNames[id]?.color ?? DEFAULT_APP_COLOR,
          }))
          .filter(b => b.usage > 0)
          .sort((a, b) => b.usage - a.usage)
        setBars(next)
        if (valid[0]) {
          const fmt = (iso: string) => new Date(iso).toLocaleDateString(loc, { day: 'numeric', month: 'short' })
          setRangeLabel(`${fmt(valid[0].rangeStart)} – ${fmt(valid[0].rangeEnd)}`)
        }
      })
    return () => { active = false }
  }, [childIds, applicationIds, appNames, range, locale, t, reloadKey])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg">{t('statistics.usageByAppChart')}</CardTitle>
        <WeekNav offset={offset} onChange={setOffset} rangeLabel={rangeLabel} />
      </CardHeader>
      <CardContent>
        {bars.length > 0 ? (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: axisColor, fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', color: tooltipText }}
                  labelStyle={{ color: tooltipText }}
                  itemStyle={{ color: tooltipText }}
                  formatter={(value: number) => [`${value} min`, t('dashboard.usageTooltip')]}
                />
                <Bar dataKey="usage" radius={[4, 4, 0, 0]} maxBarSize={64}>
                  {bars.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState icon={BarChart3} title={t('statistics.noUsageYet')} description={t('statistics.noUsageYetDesc')} />
        )}
      </CardContent>
    </Card>
  )
}
