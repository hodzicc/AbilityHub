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
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { calculateAge, formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Application, Child, FontSize, ColorScheme } from '@/lib/types'
import { ArrowLeft, Calendar, Clock, AppWindow, Lightbulb, Sparkles, Loader2 } from 'lucide-react'
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
  apiGetAppPreferences,
  apiSetAppPreferences,
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

const FONT_SIZES: { value: FontSize; label: string; size: string }[] = [
  { value: 'small',       label: 'Mala',      size: '14px' },
  { value: 'medium',      label: 'Srednja',   size: '16px' },
  { value: 'large',       label: 'Velika',    size: '18px' },
  { value: 'extra-large', label: 'Vrlo velika', size: '20px' },
]

const COLOR_SCHEMES: { value: ColorScheme; label: string; colors: string[] }[] = [
  { value: 'default',       label: 'Zadana',          colors: ['#4F46E5', '#10B981', '#F59E0B'] },
  { value: 'high-contrast', label: 'Visoki kontrast',  colors: ['#000000', '#FFFFFF', '#FF0000'] },
  { value: 'pastel',        label: 'Pastelne',         colors: ['#A5B4FC', '#86EFAC', '#FDE68A'] },
  { value: 'warm',          label: 'Tople',            colors: ['#F97316', '#FBBF24', '#EF4444'] },
]

interface ChildPrefs {
  fontSize: FontSize
  colorScheme: ColorScheme
  reducedMotion: boolean
  highContrast: boolean
  soundEnabled: boolean
}

const DEFAULT_PREFS: ChildPrefs = {
  fontSize: 'medium', colorScheme: 'default',
  reducedMotion: false, highContrast: false, soundEnabled: true,
}

function prefsToRecord(p: ChildPrefs): Record<string, string> {
  return {
    fontSize: p.fontSize,
    colorScheme: p.colorScheme,
    reducedMotion: String(p.reducedMotion),
    highContrast: String(p.highContrast),
    soundEnabled: String(p.soundEnabled),
  }
}

function recordToPrefs(r: Record<string, string>): ChildPrefs {
  return {
    fontSize: (r.fontSize as FontSize) || 'medium',
    colorScheme: (r.colorScheme as ColorScheme) || 'default',
    reducedMotion: r.reducedMotion === 'true',
    highContrast: r.highContrast === 'true',
    soundEnabled: r.soundEnabled !== 'false',
  }
}

// ── per-app prefs editor ───────────────────────────────────────────────────

function AppPrefsEditor({ childId, app }: { childId: string; app: Application }) {
  const [prefs, setPrefs] = useState<ChildPrefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiGetAppPreferences(childId, app.id)
      .then(r => { if (Object.keys(r).length) setPrefs(recordToPrefs(r)) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [childId, app.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiSetAppPreferences(childId, app.id, prefsToRecord(prefs))
      toast.success(`Preferencije za ${app.name} sačuvane`)
    } catch {
      toast.error('Greška pri čuvanju')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="h-32 animate-pulse rounded-lg bg-muted" />

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: app.color + '22', color: app.color }}>
            <AppWindow className="h-4 w-4" />
          </div>
          <CardTitle className="text-base">{app.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Font size */}
        <div>
          <p className="mb-2 text-sm font-medium">Veličina teksta</p>
          <RadioGroup
            value={prefs.fontSize}
            onValueChange={v => setPrefs(p => ({ ...p, fontSize: v as FontSize }))}
            className="grid grid-cols-4 gap-2"
          >
            {FONT_SIZES.map(fs => (
              <div key={fs.value}>
                <RadioGroupItem value={fs.value} id={`${app.id}-${fs.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`${app.id}-${fs.value}`}
                  className={cn(
                    'flex flex-col items-center rounded-lg border-2 border-muted bg-popover p-2 cursor-pointer text-xs',
                    'peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary'
                  )}
                >
                  <span style={{ fontSize: fs.size }} className="font-bold">Aa</span>
                  {fs.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Color scheme */}
        <div>
          <p className="mb-2 text-sm font-medium">Shema boja</p>
          <RadioGroup
            value={prefs.colorScheme}
            onValueChange={v => setPrefs(p => ({ ...p, colorScheme: v as ColorScheme }))}
            className="grid grid-cols-2 gap-2"
          >
            {COLOR_SCHEMES.map(cs => (
              <div key={cs.value}>
                <RadioGroupItem value={cs.value} id={`${app.id}-${cs.value}`} className="peer sr-only" />
                <Label
                  htmlFor={`${app.id}-${cs.value}`}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border-2 border-muted bg-popover p-2 cursor-pointer text-xs',
                    'peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary'
                  )}
                >
                  <div className="flex gap-0.5">
                    {cs.colors.map((c, i) => (
                      <div key={i} className="h-4 w-4 rounded-full border" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  {cs.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          {([
            ['reducedMotion', 'Smanjena animacija'],
            ['highContrast',  'Visoki kontrast'],
            ['soundEnabled',  'Zvučni efekti'],
          ] as [keyof ChildPrefs, string][]).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="text-sm">{label}</Label>
              <Switch
                checked={prefs[key] as boolean}
                onCheckedChange={v => setPrefs(p => ({ ...p, [key]: v }))}
              />
            </div>
          ))}
        </div>

        <Button size="sm" className="w-full" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Sačuvaj za {app.name}
        </Button>
      </CardContent>
    </Card>
  )
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
  const [globalPrefs, setGlobalPrefs] = useState<ChildPrefs>(DEFAULT_PREFS)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [notFoundFlag, setNotFoundFlag] = useState(false)

  useEffect(() => {
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
        setAssignedApps(enriched.filter(Boolean) as typeof enriched[number][])
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('404')) setNotFoundFlag(true)
        else toast.error('Greška pri učitavanju profila')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id, user?.id])

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
          <TabsTrigger value="prefs">Preferencije</TabsTrigger>
        </TabsList>

        {/* Apps tab */}
        <TabsContent value="apps" className="space-y-4">
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
                    {dailyTimeLimit > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('applications.dailyLimit')}</span>
                        <span className="font-semibold">{dailyTimeLimit} min</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm p-8 text-center">
              <p className="text-muted-foreground">{t('children.noAppsAssigned')}</p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/applications">{t('children.assignApps')}</Link>
              </Button>
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

        {/* Preferences tab */}
        <TabsContent value="prefs" className="space-y-6">
          {/* Global preferences */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                Globalne preferencije
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Podrazumijevane postavke za sve aplikacije. Svaka aplikacija može imati vlastite izmjene ispod.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Font size */}
              <div>
                <p className="mb-2 text-sm font-medium">Veličina teksta</p>
                <RadioGroup
                  value={globalPrefs.fontSize}
                  onValueChange={v => setGlobalPrefs(p => ({ ...p, fontSize: v as FontSize }))}
                  className="grid grid-cols-4 gap-2"
                >
                  {FONT_SIZES.map(fs => (
                    <div key={fs.value}>
                      <RadioGroupItem value={fs.value} id={`g-${fs.value}`} className="peer sr-only" />
                      <Label htmlFor={`g-${fs.value}`}
                        className={cn(
                          'flex flex-col items-center rounded-lg border-2 border-muted bg-popover p-3 cursor-pointer text-xs',
                          'peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary'
                        )}
                      >
                        <span style={{ fontSize: fs.size }} className="font-bold mb-1">Aa</span>
                        {fs.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Color scheme */}
              <div>
                <p className="mb-2 text-sm font-medium">Shema boja</p>
                <RadioGroup
                  value={globalPrefs.colorScheme}
                  onValueChange={v => setGlobalPrefs(p => ({ ...p, colorScheme: v as ColorScheme }))}
                  className="grid grid-cols-2 gap-2"
                >
                  {COLOR_SCHEMES.map(cs => (
                    <div key={cs.value}>
                      <RadioGroupItem value={cs.value} id={`g-${cs.value}`} className="peer sr-only" />
                      <Label htmlFor={`g-${cs.value}`}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border-2 border-muted bg-popover p-3 cursor-pointer text-sm',
                          'peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary'
                        )}
                      >
                        <div className="flex gap-1">
                          {cs.colors.map((c, i) => (
                            <div key={i} className="h-4 w-4 rounded-full border" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        {cs.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                {([
                  ['reducedMotion', 'Smanjena animacija', 'Smanji pokrete i prijelaze'],
                  ['highContrast',  'Visoki kontrast',   'Povećaj kontrast teksta i elemenata'],
                  ['soundEnabled',  'Zvučni efekti',     'Omogući zvukove u aplikacijama'],
                ] as [keyof ChildPrefs, string, string][]).map(([key, label, desc]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label className="text-sm font-medium">{label}</Label>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={globalPrefs[key] as boolean}
                      onCheckedChange={v => setGlobalPrefs(p => ({ ...p, [key]: v }))}
                    />
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveGlobalPrefs} disabled={savingPrefs}>
                {savingPrefs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sačuvaj globalne preferencije
              </Button>
            </CardContent>
          </Card>

          {/* Per-app overrides */}
          {assignedApps.length > 0 && (
            <div>
              <h3 className="mb-3 text-base font-semibold">Preferencije po aplikaciji</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Ove postavke imaju prednost nad globalnim za svaku aplikaciju posebno.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {assignedApps.map(({ app }) => (
                  <AppPrefsEditor key={app.id} childId={id} app={app} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
