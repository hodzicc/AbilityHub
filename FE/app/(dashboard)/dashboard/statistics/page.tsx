'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
import { toast } from 'sonner'
import {
  apiGetChildren,
  apiGetDashboard,
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

interface ChildData {
  profile: UserProfileResponse
  dashboard: DashboardResponse | null
}

/** A zeroed dashboard for a child, used when a category filter matches no apps. */
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
  // Unfiltered dashboards — the source of truth, kept fresh by the initial load
  // and realtime updates. Used to discover which apps exist (for the category
  // dropdown's app-id resolution) regardless of which category is selected.
  const [childrenData, setChildrenData] = useState<ChildData[]>([])
  // Dashboards scoped server-side to the selected category's app ids. Empty/absent
  // when selectedCategory is 'all', in which case childrenData is used directly.
  const [categoryDashboards, setCategoryDashboards] = useState<Record<string, DashboardResponse | null>>({})
  const [selectedChild, setSelectedChild] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'all'>('all')
  const [appNames, setAppNames] = useState<Record<string, { name: string; color: string; category: AppCategory }>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Admins aren't anyone's guardian, so this page has nothing to show them — see
    // the early return below.
    if (!user || user.role === 'admin') return
    const load = async () => {
      setIsLoading(true)
      try {
        const children = await apiGetChildren(user.id).catch(() => [] as UserProfileResponse[])
        const data = await Promise.all(
          children.map(async p => ({
            profile: p,
            dashboard: await apiGetDashboard(p.id).catch(() => null),
          }))
        )
        setChildrenData(data)

        // Collect the app IDs referenced by these dashboards, then resolve their
        // display info from a single catalog fetch (including inactive apps, which
        // old activities may still reference) rather than one request per app.
        const appIds = new Set<string>()
        data.forEach(d => d.dashboard?.perApp.forEach(a => appIds.add(a.applicationId)))
        data.forEach(d => d.dashboard?.recentActivities.forEach(a => appIds.add(a.applicationId)))

        const appById = new Map((await apiGetApps(true).catch(() => [])).map(a => [a.id, a]))
        const names: Record<string, { name: string; color: string; category: AppCategory }> = {}
        appIds.forEach(id => {
          const app = appById.get(id)
          names[id] = {
            name: app?.name || t('common.unknown'),
            color: app?.color || DEFAULT_APP_COLOR,
            category: (app?.category as AppCategory) || 'education',
          }
        })
        setAppNames(names)
      } catch {
        toast.error(t('statistics.loadError'))
      } finally {
        setIsLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // App ids belonging to the selected category, resolved from the apps we've
  // discovered so far. This is the dimension the backend actually filters on —
  // it doesn't know about app categories, so the frontend resolves the category
  // to a concrete app-id set (via AppRegistry data already fetched above) and
  // passes that through, instead of fetching everything and filtering client-side.
  const categoryAppIds = useMemo(() => {
    if (selectedCategory === 'all') return null
    return Object.entries(appNames)
      .filter(([, info]) => info.category === selectedCategory)
      .map(([id]) => id)
  }, [selectedCategory, appNames])

  // Re-fetch every child's dashboard scoped to the selected category whenever it
  // changes, so usage time, recent activities, avg progress and weekly consistency
  // are all computed server-side over the same filtered app set — not just the
  // recent-activity list.
  useEffect(() => {
    if (categoryAppIds === null || childrenData.length === 0) {
      setCategoryDashboards({})
      return
    }
    // No app belongs to this category → show empty stats directly. We can't send
    // an empty `applicationIds` query (an empty query value is indistinguishable
    // from "absent" over HTTP, which the backend reads as "no filter"), so we
    // synthesize empty dashboards client-side instead of calling the API.
    if (categoryAppIds.length === 0) {
      setCategoryDashboards(
        Object.fromEntries(childrenData.map(d => [d.profile.id, emptyDashboard(d.profile.id)]))
      )
      return
    }
    let active = true
    Promise.all(
      childrenData.map(async d => [
        d.profile.id,
        await apiGetDashboard(d.profile.id, categoryAppIds).catch(() => null),
      ] as const)
    ).then(entries => {
      if (active) setCategoryDashboards(Object.fromEntries(entries))
    })
    return () => { active = false }
  }, [categoryAppIds, childrenData])

  // Realtime: when a child reports usage (time / activity / live step progress),
  // re-fetch just that child's dashboard so metrics and time update instantly —
  // both the unfiltered base and, if a category filter is active, the filtered view.
  const refetchChild = useCallback(async (childId: string) => {
    const dashboard = await apiGetDashboard(childId).catch(() => null)
    setChildrenData(prev =>
      prev.map(d => (d.profile.id === childId ? { ...d, dashboard } : d))
    )
  }, [])

  useUsageRealtime(childrenData.map(d => d.profile.id), refetchChild)

  // Dashboards to actually display: the category-filtered ones when a category is
  // selected, otherwise the unfiltered base data — scoped to the selected child.
  const displayDashboards = useMemo(() => {
    const dashboardFor = (childId: string) =>
      selectedCategory === 'all'
        ? childrenData.find(d => d.profile.id === childId)?.dashboard ?? null
        : categoryDashboards[childId] ?? null

    const childIds = selectedChild === 'all'
      ? childrenData.map(d => d.profile.id)
      : [selectedChild]

    return childIds.map(dashboardFor).filter(Boolean) as DashboardResponse[]
  }, [childrenData, categoryDashboards, selectedChild, selectedCategory])

  const stats = useMemo(() => {
    const totalMinutes = displayDashboards.reduce((s, d) => s + d.totalUsageMinutes, 0)
    const totalSessions = displayDashboards.reduce(
      (s, d) => s + d.perApp.reduce((ss, a) => ss + a.sessionCount, 0), 0
    )
    const totalActivities = displayDashboards.reduce((s, d) => s + d.activityCount, 0)
    return { totalMinutes, totalActivities, totalSessions }
  }, [displayDashboards])

  // Real step-level progress when the backend reports it (avg of completed/total
  // sub-steps across activities), averaged over the selected children. Falls back
  // to the old "share of apps used" proxy only when no activity reported steps yet.
  const avgProgressIsReal = useMemo(
    () => displayDashboards.some(d => d.avgProgressPercent != null),
    [displayDashboards]
  )

  const avgProgressPercent = useMemo(() => {
    const reported = displayDashboards
      .map(d => d.avgProgressPercent)
      .filter((v): v is number => v != null)
    if (reported.length > 0) {
      return Math.round(reported.reduce((s, v) => s + v, 0) / reported.length)
    }
    const perApp = displayDashboards.flatMap(d => d.perApp)
    if (perApp.length === 0) return 0
    const usedCount = perApp.filter(a => a.totalMinutes > 0).length
    return Math.round((usedCount / perApp.length) * 100)
  }, [displayDashboards])

  // Share of the last 7 days with at least one completed activity, averaged
  // across the selected children. Directly answers the advisor's request for
  // a "consistency across days of the week" signal.
  const weeklyConsistencyPercent = useMemo(() => {
    const reported = displayDashboards
      .map(d => d.weeklyConsistency)
      .filter((v): v is number => v != null)
    if (reported.length === 0) return null
    return Math.round((reported.reduce((s, v) => s + v, 0) / reported.length) * 100)
  }, [displayDashboards])

  // Children whose data the navigable charts should aggregate (all displayed, or
  // the single selected child). The usage + outcomes charts each fetch their own
  // 7-day window from these, so they navigate weeks independently of the page.
  const chartChildIds = useMemo(
    () => (selectedChild === 'all' ? childrenData.map(d => d.profile.id) : [selectedChild]),
    [selectedChild, childrenData]
  )

  // Recent activity
  const recentActivities = useMemo(() => {
    const acts: Array<{
      id: string
      childName: string
      appId: string
      type: string
      detail: string
      occurredAt: Date
      inProgress?: boolean
      metrics?: ActivityMetrics
    }> = []
    displayDashboards.forEach((d, i) => {
      const childProfile = selectedChild === 'all'
        ? childrenData.find(cd => cd.dashboard?.childId === d.childId)?.profile
        : childrenData.find(cd => cd.profile.id === selectedChild)?.profile
      const childName = childProfile
        ? `${childProfile.firstName} ${childProfile.lastName}`.trim()
        : t('common.unknown')
      d.recentActivities.forEach((a, j) => {
        acts.push({
          id: a.id ?? `${i}-${j}`,
          childName,
          appId: a.applicationId,
          type: a.activityType,
          detail: describeActivity(a, t),
          occurredAt: new Date(a.occurredAt),
          inProgress: a.inProgress,
          metrics: a.metrics,
        })
      })
    })
    return acts.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()).slice(0, 15)
  }, [displayDashboards, childrenData, selectedChild, t])

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
            {childrenData.map(cd => (
              <SelectItem key={cd.profile.id} value={cd.profile.id}>
                {cd.profile.firstName} {cd.profile.lastName}
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
                <UsageByAppChart childIds={chartChildIds} applicationIds={categoryAppIds} appNames={appNames} />
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
                <ActivityMetricsChart childIds={chartChildIds} applicationIds={categoryAppIds} />
              </div>

              <Card className="flex flex-col lg:col-start-3 lg:row-start-2">
                <CardHeader>
                  <CardTitle className="text-lg">{t('statistics.activityHeatmap')}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-center">
                  <ActivityCalendar childIds={chartChildIds} applicationIds={categoryAppIds} appNames={appNames} />
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
                childName={
                  childrenData.find(cd => cd.profile.id === selectedChild)
                    ? `${childrenData.find(cd => cd.profile.id === selectedChild)!.profile.firstName} ${childrenData.find(cd => cd.profile.id === selectedChild)!.profile.lastName}`.trim()
                    : ''
                }
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
