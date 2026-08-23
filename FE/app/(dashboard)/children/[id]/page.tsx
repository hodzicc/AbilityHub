'use client'

import { use, useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useAuth, useTranslation } from '@/components/providers'
import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppPreferencesList } from '@/components/preferences'
import { AssignAppsDialog, TimeLimitDialog, ChildActivityFeed, QrPairingCard } from '@/components/children'
import { calculateAge, formatDuration, cn } from '@/lib/utils'
import { DEFAULT_PREFERENCES, recordToPrefs } from '@/lib/preferences'
import { FALLBACK_DATE_OF_BIRTH } from '@/lib/constants'
import type { Application, Child, UIPreferences } from '@/lib/types'
import { ArrowLeft, Calendar, Clock, AppWindow, Lightbulb, Sparkles, Plus, ShieldCheck, Pencil } from 'lucide-react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  apiGetUser,
  apiGetChildApps,
  apiGetDashboard,
  apiGetApp,
  apiGetRestriction,
  apiGetPreferences,
  type DashboardResponse,
} from '@/lib/api'
import { responseToApp } from '@/lib/applications'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

// ── main page ──────────────────────────────────────────────────────────────

export default function ChildProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t } = useTranslation()
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  // Recharts renders axis ticks as SVG <text fill="...">; CSS variables don't resolve
  // in the SVG fill attribute, so pass concrete theme-aware colors (else dark mode
  // falls back to black text). Mirrors the statistics page.
  const isDark = resolvedTheme === 'dark'
  const axisColor = isDark ? '#cbd5e1' : '#475569'
  const gridColor = isDark ? '#334155' : '#e2e8f0'
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const tooltipText = isDark ? '#f1f5f9' : '#0f172a'

  const [child, setChild] = useState<Child | null>(null)
  const [assignedApps, setAssignedApps] = useState<Array<{
    app: Application; dailyTimeLimit: number; totalMinutes: number
  }>>([])
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [globalPrefs, setGlobalPrefs] = useState<UIPreferences>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(true)
  const [notFoundFlag, setNotFoundFlag] = useState(false)
  const [isAssignAppsOpen, setIsAssignAppsOpen] = useState(false)
  const [limitApp, setLimitApp] = useState<Application | null>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id])

  const load = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const [profile, childApps, dash, rawPrefs] = await Promise.all([
        apiGetUser(id),
        apiGetChildApps(id),
        apiGetDashboard(id).catch(() => null),
        apiGetPreferences(id).catch(() => ({} as Record<string, string>)),
      ])

      setChild({
        id: profile.id,
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        firstName: profile.firstName, lastName: profile.lastName,
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : FALLBACK_DATE_OF_BIRTH,
        gender: (profile.gender as 'male' | 'female') ?? 'male',
        parentId: user.id,
        assignedApps: childApps.map(a => a.applicationId),
        createdAt: new Date(profile.createdAt),
      })
      setDashboard(dash)
      if (Object.keys(rawPrefs).length) setGlobalPrefs(recordToPrefs(rawPrefs))

      const enriched = await Promise.all(
        childApps.map(async ca => {
          const [appData, restriction] = await Promise.all([
            apiGetApp(ca.applicationId).catch(() => null),
            apiGetRestriction(id, ca.applicationId).catch(() => ({ dailyTimeLimitMinutes: null, isBlocked: false })),
          ])
          if (!appData) return null
          const perApp = dash?.perApp.find(p => p.applicationId === ca.applicationId)
          return {
            app: responseToApp(appData),
            dailyTimeLimit: restriction.dailyTimeLimitMinutes ?? 0,
            totalMinutes: perApp?.totalMinutes ?? 0,
          }
        })
      )
      setAssignedApps(
        enriched.filter((e): e is NonNullable<typeof e> => e !== null)
      )
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('404')) setNotFoundFlag(true)
      else toast.error(t('children.loadProfileError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (notFoundFlag) notFound()
  if (isLoading || !child) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  const isAdmin = user?.role === 'admin'
  const age = calculateAge(child.dateOfBirth)
  const totalUsage = dashboard?.totalUsageMinutes ?? 0
  const recommendations = dashboard?.recommendations ?? []
  // One bar per app, not a line — apps are discrete categories, not points along a
  // continuous axis, so a line/area chart implies a trend between them that isn't real.
  const usageChartData = assignedApps.map(a => ({
    name: a.app.name.slice(0, 12),
    usage: a.totalMinutes,
    color: a.app.color,
  }))

  const getGenderColor = (g: string) =>
    g === 'male'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'

  return (
    <div className="space-y-6">
      <PageHeader title={t('children.childProfile')}>
        <Button variant="outline" asChild>
          <Link href="/children">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Link>
        </Button>
      </PageHeader>

      {isAdmin && (
        <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-800 dark:bg-indigo-900/10">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            {t('children.adminViewBanner')}
          </p>
        </div>
      )}

      {/* Profile header */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar className="h-24 w-24 mx-auto sm:mx-0">
              <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-2xl font-bold">
                {child.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold">{child.name}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                <Badge variant="secondary" className={cn('border-0', getGenderColor(child.gender))}>
                  {t(`children.${child.gender}`)}
                </Badge>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {age} {t('children.years')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 text-center">
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{assignedApps.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('applications.assigned')}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatDuration(totalUsage)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('children.totalUsage')}</p>
                <p className="text-[10px] text-muted-foreground/70">{t('children.last7Days')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
              <Lightbulb className="h-5 w-5" />
              {t('children.recommendationsTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                  <span>{t(`children.recommendations.${rec.type}`, rec.params)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="apps" className="space-y-6">
        <TabsList>
          <TabsTrigger value="apps">{t('children.assignedApps')}</TabsTrigger>
          <TabsTrigger value="progress">{t('children.progress')}</TabsTrigger>
          {!isAdmin && <TabsTrigger value="prefs">{t('children.preferencesTab')}</TabsTrigger>}
          {!isAdmin && <TabsTrigger value="login">{t('qrPairing.tabLabel')}</TabsTrigger>}
        </TabsList>

        {/* Apps tab */}
        <TabsContent value="apps" className="space-y-4">
          {!isAdmin && (
            <div className="flex justify-end">
              <Button onClick={() => setIsAssignAppsOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('children.assignApps')}
              </Button>
            </div>
          )}
          {assignedApps.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assignedApps.map(({ app, dailyTimeLimit, totalMinutes }) => (
                <Card key={app.id} className="border-0 shadow-sm overflow-hidden">
                  <div className="h-1.5 w-full" style={{ backgroundColor: app.color }} />
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: app.color + '22', color: app.color }}>
                        <AppWindow className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{app.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{t(`applications.categories.${app.category}`)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {t('children.totalUsage')}
                      </span>
                      <span className="font-semibold">{formatDuration(totalMinutes)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('applications.dailyLimit')}</span>
                      <span className="flex items-center gap-1">
                        <span className="font-semibold">
                          {dailyTimeLimit > 0 ? `${dailyTimeLimit} min` : t('applications.noLimit')}
                        </span>
                        {!isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            title={t('children.editTimeLimitTitle')}
                            onClick={() => setLimitApp(app)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm p-8 text-center">
              <p className="text-muted-foreground">{t('children.noAppsAssigned')}</p>
              {!isAdmin && (
                <Button className="mt-4" onClick={() => setIsAssignAppsOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('children.assignApps')}
                </Button>
              )}
            </Card>
          )}
        </TabsContent>

        {/* Progress tab */}
        <TabsContent value="progress" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>{t('children.usageByAppTitle')}</CardTitle>
                <CardDescription>{t('children.last7Days')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usageChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false}
                        tick={{ fill: axisColor, fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false}
                        tick={{ fill: axisColor, fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: tooltipBg,
                          border: `1px solid ${tooltipBorder}`,
                          borderRadius: '10px',
                        }}
                        labelStyle={{ color: tooltipText }}
                        itemStyle={{ color: tooltipText }}
                        formatter={(v: number) => [`${v} min`, t('dashboard.usageTooltip')]}
                      />
                      <Bar dataKey="usage" radius={[6, 6, 0, 0]} minPointSize={4}>
                        {usageChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color || '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <ChildActivityFeed
              activities={dashboard?.recentActivities ?? []}
              apps={assignedApps.map(({ app }) => app)}
            />
          </div>

          <div>
            <h3 className="mb-1 text-base font-semibold">{t('children.usageByAppBreakdown')}</h3>
            <p className="mb-3 text-xs text-muted-foreground">{t('children.last7Days')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {assignedApps.map(({ app, totalMinutes }) => (
              <Card key={app.id} className="border-0 shadow-sm">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: app.color + '22', color: app.color }}>
                      <AppWindow className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{app.name}</span>
                    <span className="ml-auto text-sm font-semibold">{formatDuration(totalMinutes)}</span>
                  </div>
                  <Progress
                    value={totalUsage > 0 ? Math.round((totalMinutes / totalUsage) * 100) : 0}
                    className="h-2"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Preferences tab (parent only) */}
        {!isAdmin && (
        <TabsContent value="prefs" className="space-y-6">
          {/* Per-app preferences — global defaults are edited from the main "Preferences" menu */}
          {assignedApps.length > 0 ? (
            <div>
              <h3 className="mb-3 text-base font-semibold">{t('children.perAppPreferencesTitle')}</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {t('children.perAppPreferencesDesc')}
              </p>
              <AppPreferencesList childId={id} apps={assignedApps.map(({ app }) => app)} globalPrefs={globalPrefs} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('children.noAppsAssigned')}</p>
          )}
        </TabsContent>
        )}

        {/* QR pairing for child mobile login (parent only) */}
        {!isAdmin && (
        <TabsContent value="login" className="space-y-6">
          <QrPairingCard childId={id} childName={child?.name ?? ''} />
        </TabsContent>
        )}
      </Tabs>

      {/* Bulk-assign apps to this child (parent only) */}
      {!isAdmin && (
        <AssignAppsDialog
          open={isAssignAppsOpen}
          onOpenChange={setIsAssignAppsOpen}
          childId={id}
          childName={child.name}
          assignedAppIds={child.assignedApps}
          onAssigned={load}
        />
      )}

      {/* Edit daily time limit for a single assigned app (parent only) */}
      {!isAdmin && limitApp && (
        <TimeLimitDialog
          open={!!limitApp}
          onOpenChange={(open) => !open && setLimitApp(null)}
          childId={id}
          appId={limitApp.id}
          appName={limitApp.name}
          onSaved={load}
        />
      )}
    </div>
  )
}
