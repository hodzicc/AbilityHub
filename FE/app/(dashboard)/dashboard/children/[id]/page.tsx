'use client'

import { use, useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useAuth, useTranslation } from '@/components/providers'
import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PreferenceFields, PreferencePreview, AppPreferencesList } from '@/components/preferences'
import { AssignAppsDialog, TimeLimitDialog } from '@/components/children'
import { calculateAge, formatDuration, cn } from '@/lib/utils'
import { DEFAULT_PREFERENCES, prefsToRecord, recordToPrefs } from '@/lib/preferences'
import type { Application, Child, UIPreferences } from '@/lib/types'
import { ArrowLeft, Calendar, Clock, AppWindow, Lightbulb, Sparkles, Loader2, Plus, ShieldCheck, Pencil } from 'lucide-react'
import {
  AreaChart,
  Area,
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
  apiSetPreferences,
  type DashboardResponse,
  type ApplicationResponse,
} from '@/lib/api'
import { toast } from 'sonner'

// ── helpers ────────────────────────────────────────────────────────────────

function responseToApp(r: ApplicationResponse): Application {
  let features: string[] = []
  try { features = JSON.parse(r.featuresJson) } catch {}
  return {
    id: r.id, key: r.key, name: r.name, description: r.description,
    category: (r.category as Application['category']) || 'education',
    icon: r.iconName || 'AppWindow', color: r.color || '#4F46E5',
    minAge: r.minAge, maxAge: r.maxAge, features, isActive: r.isActive,
    platform: (r.platform?.toLowerCase() as 'web' | 'mobile' | 'hybrid') || 'mobile',
  }
}

// ── main page ──────────────────────────────────────────────────────────────

export default function ChildProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t } = useTranslation()
  const { user } = useAuth()

  const [child, setChild] = useState<Child | null>(null)
  const [assignedApps, setAssignedApps] = useState<Array<{
    app: Application; dailyTimeLimit: number; totalMinutes: number
  }>>([])
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [globalPrefs, setGlobalPrefs] = useState<UIPreferences>(DEFAULT_PREFERENCES)
  const [savingPrefs, setSavingPrefs] = useState(false)
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
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : new Date('2015-01-01'),
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
      else toast.error('Greška pri učitavanju profila')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveGlobalPrefs = async () => {
    setSavingPrefs(true)
    try {
      await apiSetPreferences(id, prefsToRecord(globalPrefs))
      toast.success('Globalne preferencije sačuvane')
    } catch {
      toast.error('Greška pri čuvanju preferencija')
    } finally {
      setSavingPrefs(false)
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
  const usageChartData = assignedApps.map(a => ({ date: a.app.name.slice(0, 12), usage: a.totalMinutes }))

  const getGenderColor = (g: string) =>
    g === 'male'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'

  return (
    <div className="space-y-6">
      <PageHeader title={t('children.childProfile')}>
        <Button variant="outline" asChild>
          <Link href="/dashboard/children">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Link>
        </Button>
      </PageHeader>

      {isAdmin && (
        <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-800 dark:bg-indigo-900/10">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            Administratorski prikaz — uvid u profil i korištenje. Dodjelu aplikacija i postavke uređuje roditelj.
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
              Preporuke za dalje aktivnosti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                  <span>{rec}</span>
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
          {!isAdmin && <TabsTrigger value="prefs">Preferencije</TabsTrigger>}
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
                          {dailyTimeLimit > 0 ? `${dailyTimeLimit} min` : 'Bez ograničenja'}
                        </span>
                        {!isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            title="Uredi vremensko ograničenje"
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
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Ukupno korištenje po aplikaciji</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageChartData}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '10px',
                    }} formatter={(v: number) => [`${v} min`, 'Korištenje']} />
                    <Area type="monotone" dataKey="usage" stroke="#6366f1" strokeWidth={2} fill="url(#areaGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

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
          {/* Global preferences */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                Globalne preferencije
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Podrazumijevane postavke za sve aplikacije. Svaka aplikacija može po potrebi imati vlastite izmjene.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
                <div className="space-y-5">
                  <PreferenceFields value={globalPrefs} onChange={setGlobalPrefs} idPrefix="global" />
                  <Button onClick={handleSaveGlobalPrefs} disabled={savingPrefs}>
                    {savingPrefs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sačuvaj globalne preferencije
                  </Button>
                </div>
                <PreferencePreview preferences={globalPrefs} className="lg:w-64" />
              </div>
            </CardContent>
          </Card>

          {/* Per-app overrides */}
          {assignedApps.length > 0 && (
            <div>
              <h3 className="mb-3 text-base font-semibold">Preferencije po aplikaciji</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Pregled koje aplikacije koriste globalne postavke, a koje imaju prilagođene. Kliknite na aplikaciju za izmjenu.
              </p>
              <AppPreferencesList childId={id} apps={assignedApps.map(({ app }) => app)} globalPrefs={globalPrefs} />
            </div>
          )}
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
