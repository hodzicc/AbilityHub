'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth, useTranslation } from '@/components/providers'
import { PageHeader } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDuration, formatShortDuration } from '@/lib/utils'
import { Clock, TrendingUp, Calendar, Sparkles, Loader2, Play } from 'lucide-react'
import {
  apiGetChildren,
  apiGetCombinedDashboard,
  apiGetApps,
  type DashboardResponse,
  type UserProfileResponse,
} from '@/lib/api'
import type { AppCategory, ActivityMetrics } from '@/lib/types'
import { APP_CATEGORIES, DEFAULT_APP_COLOR } from '@/lib/constants'
import { ACTIVITY_ICONS, activityTypeToAction, describeActivity } from '@/lib/activity'
import { WeeklyCheckInCard } from '@/components/statistics/weekly-checkin-card'
import { ActivityCalendar } from '@/components/statistics/activity-calendar'
import { UsageByAppChart } from '@/components/statistics/usage-by-app-chart'
import { ActivityMetricsChart } from '@/components/statistics/activity-metrics-chart'
import { weekRange } from '@/components/statistics/week-nav'
import { useUsageRealtime } from '@/lib/realtime/use-usage-realtime'

const categories: (AppCategory | 'all')[] = ['all', ...APP_CATEGORIES.map(c => c.value)]

/** A zeroed dashboard, used when a category filter matches no apps. */
function emptyDashboard(childId: string): DashboardResponse {
  return {
    childId,
    generatedAt: new Date().toISOString(),
    rangeStart: weekRange(0).from,
    rangeEnd: weekRange(0).to,
    totalUsageMinutes: 0,
    activityCount: 0,
    avgProgressPercent: null,
    weeklyConsistency: null,
    perApp: [],
    recentActivities: [],
    recommendations: [],
    activeDays: [],
    dailyUsage: [],
  }
}

export default function StatisticsPage() {
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  // The children this guardian can see — for the selector and for resolving the
  // names on recent-activity rows.
  const [profiles, setProfiles] = useState<UserProfileResponse[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'all'>('all')
  // App catalog (all apps, including inactive ones old activity may still reference):
  // display name/colour, and the category each app belongs to so a selected category
  // can be resolved to the concrete app-id set the backend actually filters on.
  const [appNames, setAppNames] = useState<Record<string, { name: string; color: string; category: AppCategory }>>({})
  // The dashboard for the current selection, combined server-side across the selected
  // children (all of them, or one) and scoped to the selected category — a single call,
  // not one dashboard per child summed in the browser.
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Bumped on each realtime usage change to re-run the dashboard fetch below and to
  // nudge the charts (which fetch their own windows) to refresh.
  const [realtimeTick, setRealtimeTick] = useState(0)

  // Child list + app catalog, loaded once.
  useEffect(() => {
    // Admins aren't anyone's guardian, so this page has nothing to show them — see
    // the early return below.
    if (!user || user.role === 'admin') return
    let active = true
    ;(async () => {
      const [children, apps] = await Promise.all([
        apiGetChildren(user.id).catch(() => [] as UserProfileResponse[]),
        apiGetApps(true).catch(() => []),
      ])
      if (!active) return
      setProfiles(children)
      const names: Record<string, { name: string; color: string; category: AppCategory }> = {}
      apps.forEach(a => {
        names[a.id] = {
          name: a.name || t('common.unknown'),
          color: a.color || DEFAULT_APP_COLOR,
          category: (a.category as AppCategory) || 'education',
        }
      })
      setAppNames(names)
    })()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // App ids belonging to the selected category (null = all apps). The backend filters
  // on app ids, not categories, so we resolve the category via the catalog above.
  const categoryAppIds = useMemo(() => {
    if (selectedCategory === 'all') return null
    return Object.entries(appNames)
      .filter(([, info]) => info.category === selectedCategory)
      .map(([id]) => id)
  }, [selectedCategory, appNames])

  // The children in scope: all of them, or the single selected one.
  const chartChildIds = useMemo(
    () => (selectedChild === 'all' ? profiles.map(p => p.id) : [selectedChild]),
    [selectedChild, profiles]
  )
  const scopeKey = chartChildIds.join(',')
  const categoryKey = categoryAppIds === null ? 'all' : categoryAppIds.join(',')

  // Fetch the combined dashboard for the current scope + category in one call, refetched
  // when the selection/category changes or a realtime event bumps the tick.
  useEffect(() => {
    if (!user || user.role === 'admin') return
    setIsLoading(true)
    // Nothing in scope, or a category that resolves to no apps → show empty stats. (An
    // empty applicationIds query is indistinguishable from "absent" over HTTP, which the
    // backend reads as "no filter", so we synthesize an empty dashboard instead.)
    if (chartChildIds.length === 0 || (categoryAppIds !== null && categoryAppIds.length === 0)) {
      setDashboard(emptyDashboard(''))
      setIsLoading(false)
      return
    }
    let active = true
    apiGetCombinedDashboard(chartChildIds, categoryAppIds ?? undefined)
      .catch(() => null)
      .then(d => { if (active) { setDashboard(d); setIsLoading(false) } })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey, categoryKey, realtimeTick])

  // Realtime: when any child in scope reports usage, refetch the combined dashboard
  // (via the tick) and let the charts re-fetch their own windows.
  useUsageRealtime(chartChildIds, () => setRealtimeTick(v => v + 1))

  const stats = useMemo(() => ({
    totalMinutes: dashboard?.totalUsageMinutes ?? 0,
    totalSessions: dashboard?.perApp.reduce((s, a) => s + a.sessionCount, 0) ?? 0,
    totalActivities: dashboard?.activityCount ?? 0,
  }), [dashboard])

  // Real step-level progress when the backend reports it (avg of completed/total
  // sub-steps across the scope's activities). Falls back to the old "share of apps
  // used" proxy only when no activity reported steps yet.
  const avgProgressIsReal = dashboard?.avgProgressPercent != null

  const avgProgressPercent = useMemo(() => {
    if (dashboard?.avgProgressPercent != null) return Math.round(dashboard.avgProgressPercent)
    const perApp = dashboard?.perApp ?? []
    if (perApp.length === 0) return 0
    const usedCount = perApp.filter(a => a.totalMinutes > 0).length
    return Math.round((usedCount / perApp.length) * 100)
  }, [dashboard])

  // Share of the last 7 days with at least one completed activity across the scope.
  const weeklyConsistencyPercent = useMemo(() => {
    if (dashboard?.weeklyConsistency == null) return null
    return Math.round(dashboard.weeklyConsistency * 100)
  }, [dashboard])

  // Recent activity across the scope, with each row's child name resolved from the profiles.
  const recentActivities = useMemo(() => {
    if (!dashboard) return []
    const nameById = new Map(profiles.map(p => [p.id, `${p.firstName} ${p.lastName}`.trim()]))
    return dashboard.recentActivities
      .map((a, j) => ({
        id: a.id ?? `${j}`,
        childName: nameById.get(a.childId) ?? t('common.unknown'),
        appId: a.applicationId,
        type: a.activityType,
        detail: describeActivity(a, t),
        occurredAt: new Date(a.occurredAt),
        inProgress: a.inProgress,
        metrics: a.metrics as ActivityMetrics | undefined,
      }))
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, 15)
  }, [dashboard, profiles, t])

  // Per-child statistics (weekly check-ins, heatmap, category filters) don't apply to
  // an admin, who isn't anyone's guardian — the dashboard's aggregate figures already
  // cover what an admin needs. Reachable only via a direct URL (the sidebar hides it).
  if (user?.role === 'admin') {
    return (
      <div className="space-y-6">
        <PageHeader title={t('statistics.title')} description={t('statistics.subtitle')} />
        <Card className="border-0 shadow-sm">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t('statistics.notAvailableForAdmin')}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('statistics.title')}
        description={t('statistics.subtitle')}
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Select value={selectedChild} onValueChange={setSelectedChild}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t('statistics.selectChild')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('statistics.allChildren')}</SelectItem>
            {profiles.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              className={selectedCategory === category
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-sm'
                : 'hover:border-primary/60'}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? t('common.all') : t(`applications.categories.${category}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('statistics.totalTime')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.totalMinutes)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('statistics.sessions')}
            </CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('statistics.activityCount')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('statistics.avgProgress')}
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProgressPercent}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {avgProgressIsReal ? t('statistics.avgProgressNote') : t('statistics.avgProgressNoteFallback')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('statistics.weeklyConsistency')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyConsistencyPercent != null ? `${weeklyConsistencyPercent}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {weeklyConsistencyPercent != null ? t('statistics.weeklyConsistencyNote') : t('statistics.weeklyConsistencyUnavailable')}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">{t('statistics.overview')}</TabsTrigger>
            <TabsTrigger value="checkins">{t('statistics.parentEvaluations')}</TabsTrigger>
          </TabsList>

          {/* Overview: usage charts + activity + heatmap in one balanced layout */}
          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Placed explicitly so each row's pair (chart|chart, activity|heatmap)
                  shares the row height via the grid's default items-stretch. */}
              <div className="lg:col-span-2 lg:row-start-1">
                <UsageByAppChart childIds={chartChildIds} applicationIds={categoryAppIds} appNames={appNames} reloadKey={realtimeTick} />
              </div>

                <Card className="lg:col-span-2 lg:row-start-2">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('dashboard.recentActivity')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentActivities.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {t('statistics.noActivities')}
                      </p>
                    ) : (
                      <div className="max-h-[440px] space-y-4 overflow-y-auto pr-1">
                        {recentActivities.map(activity => {
                          const app = appNames[activity.appId]
                          const action = activityTypeToAction(activity.type)
                          // In-progress activities show a spinner, not the "completed" check.
                          const Icon = activity.inProgress ? Loader2 : ACTIVITY_ICONS[action]
                          const metrics = activity.metrics
                          return (
                            <div key={activity.id} className="pb-4 border-b last:border-0">
                              <div className="flex w-full items-start gap-4 text-left">
                                <div
                                  className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                                  style={{ backgroundColor: (app?.color ?? '#666') + '20', color: app?.color ?? '#666' }}
                                >
                                  <Icon className={`h-5 w-5 ${activity.inProgress ? 'animate-spin' : ''}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">{activity.childName}</span>
                                    <Badge variant="secondary">{app?.name ?? t('common.unknown')}</Badge>
                                    {activity.inProgress && (
                                      <Badge className="bg-amber-500 hover:bg-amber-500 text-white animate-pulse">
                                        {activity.metrics?.stepsTotal != null
                                          ? t('statistics.inProgressStep', {
                                              step: String(Math.min((activity.metrics.stepsCompleted ?? 0) + 1, activity.metrics.stepsTotal)),
                                              total: String(activity.metrics.stepsTotal),
                                            })
                                          : t('statistics.inProgress')}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{activity.detail}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {activity.occurredAt.toLocaleString(locale === 'bs' ? 'bs-BA' : 'en-US')}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 ml-14 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                {metrics ? (
                                  <>
                                    <MetricBadge label={t('statistics.metrics.startedViaAction')} value={metrics.startedViaAction} notAvailableLabel={t('statistics.notAvailable')} />
                                    <MetricBadge label={t('statistics.metrics.completedViaAction')} value={metrics.completedViaAction} notAvailableLabel={t('statistics.notAvailable')} />
                                    <MetricBadge
                                      label={t('statistics.metrics.steps')}
                                      value={metrics.stepsTotal != null ? `${metrics.stepsCompleted}/${metrics.stepsTotal}` : undefined}
                                      notAvailableLabel={t('statistics.notAvailable')}
                                    />
                                    <MetricBadge
                                      label={t('statistics.metrics.duration')}
                                      value={metrics.durationSeconds != null ? formatShortDuration(metrics.durationSeconds) : undefined}
                                      notAvailableLabel={t('statistics.notAvailable')}
                                    />
                                    <MetricBadge label={t('statistics.metrics.hintsShown')} value={metrics.hintsShown} notAvailableLabel={t('statistics.notAvailable')} />
                                    <MetricBadge label={t('statistics.metrics.errors')} value={metrics.errorsCount} notAvailableLabel={t('statistics.notAvailable')} />
                                  </>
                                ) : (
                                  <p className="col-span-full text-muted-foreground">{t('statistics.notAvailableForApp')}</p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

              <div className="lg:col-start-3 lg:row-start-1">
                <ActivityMetricsChart childIds={chartChildIds} applicationIds={categoryAppIds} reloadKey={realtimeTick} />
              </div>

              <Card className="flex flex-col lg:col-start-3 lg:row-start-2">
                <CardHeader>
                  <CardTitle className="text-lg">{t('statistics.activityHeatmap')}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-center">
                  <ActivityCalendar childIds={chartChildIds} applicationIds={categoryAppIds} appNames={appNames} reloadKey={realtimeTick} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Weekly parent evaluation tab */}
          <TabsContent value="checkins">
            {selectedChild === 'all' ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('statistics.selectChildForCheckin')}
              </p>
            ) : (
              <WeeklyCheckInCard
                childId={selectedChild}
                childName={(() => {
                  const p = profiles.find(p => p.id === selectedChild)
                  return p ? `${p.firstName} ${p.lastName}`.trim() : ''
                })()}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function MetricBadge({
  label, value, notAvailableLabel,
}: {
  label: string
  value: boolean | number | string | undefined
  notAvailableLabel: string
}) {
  if (value === undefined) {
    return (
      <div className="rounded-md border bg-muted/30 px-2 py-1.5">
        <p className="text-muted-foreground">{label}</p>
        <p className="text-muted-foreground/70">{notAvailableLabel}</p>
      </div>
    )
  }
  const display = typeof value === 'boolean' ? (value ? '✓' : '✗') : value
  return (
    <div className="rounded-md border px-2 py-1.5">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{display}</p>
    </div>
  )
}
