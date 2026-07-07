'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth, useTranslation } from '@/components/providers'
import { PageHeader } from '@/components/shared'
import { StatsCards, ActivityFeed } from '@/components/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  ArrowRight,
  Users,
  AppWindow,
  BarChart3,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useTheme } from 'next-themes'
import { apiGetChildren, apiGetApps, apiGetUserSummary, apiGetDashboard, apiGetAdminDashboard, apiGetWeeklyCheckIns, type DashboardResponse } from '@/lib/api'
import { useUsageRealtime } from '@/lib/realtime/use-usage-realtime'
import { currentWeekStart } from '@/lib/utils'
import { BellRing } from 'lucide-react'

interface DashStats {
  childrenCount: number
  activeAppsCount: number
  todayUsageMinutes: number
  avgProgress: number
  weeklyData: { name: string; usage: number }[]
}

function getQuickActions(t: (key: string) => string) {
  return [
    {
      href: '/dashboard/children',
      icon: Users,
      label: t('dashboard.quickActionChildren'),
      description: t('dashboard.quickActionChildrenDesc'),
      gradient: 'from-indigo-500 to-indigo-600',
      shadow: 'shadow-indigo-200 dark:shadow-indigo-900/40',
    },
    {
      href: '/dashboard/applications',
      icon: AppWindow,
      label: t('dashboard.quickActionApplications'),
      description: t('dashboard.quickActionApplicationsDesc'),
      gradient: 'from-orange-400 to-orange-500',
      shadow: 'shadow-orange-200 dark:shadow-orange-900/40',
    },
    {
      href: '/dashboard/statistics',
      icon: BarChart3,
      label: t('dashboard.quickActionStatistics'),
      description: t('dashboard.quickActionStatisticsDesc'),
      gradient: 'from-emerald-400 to-emerald-500',
      shadow: 'shadow-emerald-200 dark:shadow-emerald-900/40',
    },
    {
      href: '/dashboard/settings',
      icon: Settings,
      label: t('dashboard.quickActionSettings'),
      description: t('dashboard.quickActionSettingsDesc'),
      gradient: 'from-purple-400 to-purple-600',
      shadow: 'shadow-purple-200 dark:shadow-purple-900/40',
    },
  ]
}

function getPlatformCards(t: (key: string) => string, isAdmin: boolean) {
  return [
    {
      icon: ShieldCheck,
      title: t('dashboard.platformCard1Title'),
      description: t('dashboard.platformCard1Desc'),
      color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
      href: null,
    },
    // Synced preferences are per-child, so this card makes no sense for admins (who have no children).
    ...(isAdmin ? [] : [{
      icon: Sparkles,
      title: t('dashboard.platformCard2Title'),
      description: t('dashboard.platformCard2Desc'),
      color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      href: '/dashboard/preferences',
    }]),
  ]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { t, locale } = useTranslation()
  const quickActions = getQuickActions(t)
  const platformCards = getPlatformCards(t, user?.role === 'admin')
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const gridColor = isDark ? '#334155' : '#e2e8f0'
  const tickColor = isDark ? '#94a3b8' : '#64748b'
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const [stats, setStats] = useState<DashStats>({
    childrenCount: 0,
    activeAppsCount: 0,
    todayUsageMinutes: 0,
    avgProgress: 0,
    weeklyData: [],
  })
  // Children to watch over realtime, and a counter the push bumps to re-load.
  const [watchedIds, setWatchedIds] = useState<string[]>([])
  const [reloadKey, setReloadKey] = useState(0)
  // Names of the parent's own children still missing this week's evaluation —
  // a proactive nudge instead of only surfacing it once they open Statistics.
  const [checkInReminders, setCheckInReminders] = useState<string[]>([])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const isAdmin = user.role === 'admin'
      // Admins don't need the full child-profile list at all: the platform-wide
      // stats come from one aggregate call, the child *count* comes from the
      // directory summary (accurate regardless of how many children exist), and
      // there's no per-child realtime subscription to set up (see below).
      const [appsData, childProfiles, adminSummary] = await Promise.all([
        apiGetApps(isAdmin).catch(() => []),
        isAdmin ? Promise.resolve([]) : apiGetChildren(user.id).catch(() => []),
        isAdmin ? apiGetUserSummary().catch(() => null) : Promise.resolve(null),
      ])

      // Admins don't watch individual children over the realtime hub — that would
      // mean one WatchChild call per child on the platform just to feed a view that
      // only ever renders the aggregate dashboard. The aggregate figures refresh on
      // navigation instead.
      setWatchedIds(isAdmin ? [] : childProfiles.map(c => c.id))

      // Admins see a platform-wide snapshot computed by the backend in one call,
      // rather than fetching every child's individual dashboard.
      let perDayMinutes: number[]
      let avgProgress: number

      if (isAdmin) {
        const adminDash = await apiGetAdminDashboard().catch(() => null)
        perDayMinutes = adminDash?.dailyUsage?.map(d => d.minutes) ?? Array(7).fill(0)
        avgProgress = Math.round(adminDash?.avgProgressPercent ?? 0)
      } else {
        const dashboards = await Promise.all(
          childProfiles.map(c => apiGetDashboard(c.id).catch(() => null as DashboardResponse | null))
        )

        // Real per-day usage (last 7 days), summed across children. Each child's
        // dailyUsage is aligned oldest→newest, so we add element-wise.
        perDayMinutes = Array(7).fill(0) as number[]
        dashboards.forEach(d => {
          d?.dailyUsage?.forEach((day, i) => {
            if (i < perDayMinutes.length) perDayMinutes[i] += day.minutes
          })
        })

        // Real step-level progress when reported by the backend (avg of completed/
        // total sub-steps), averaged across children. Falls back to the "share of
        // apps used" proxy only until activities start reporting step metrics.
        const reportedProgress = dashboards
          .map(d => d?.avgProgressPercent)
          .filter((v): v is number => v != null)
        const perAppEntries = dashboards.flatMap(d => d?.perApp ?? [])
        avgProgress = reportedProgress.length > 0
          ? Math.round(reportedProgress.reduce((s, v) => s + v, 0) / reportedProgress.length)
          : perAppEntries.length === 0
            ? 0
            : Math.round((perAppEntries.filter(a => a.totalMinutes > 0).length / perAppEntries.length) * 100)
      }

      const todayUsage = perDayMinutes[perDayMinutes.length - 1] ?? 0

      const last7 = perDayMinutes.map((usage, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return {
          name: d.toLocaleDateString(locale === 'bs' ? 'bs-BA' : 'en-US', { weekday: 'short' }),
          usage,
        }
      })

      setStats({
        childrenCount: isAdmin ? (adminSummary?.childCount ?? 0) : childProfiles.length,
        activeAppsCount: appsData.filter(a => a.isActive).length,
        todayUsageMinutes: todayUsage,
        avgProgress,
        weeklyData: last7,
      })

      if (!isAdmin && childProfiles.length > 0) {
        const thisWeek = currentWeekStart()
        const checkIns = await Promise.all(
          childProfiles.map(c => apiGetWeeklyCheckIns(c.id).catch(() => []))
        )
        setCheckInReminders(
          childProfiles
            .filter((c, i) => !checkIns[i].some(k => k.weekStartDate === thisWeek))
            .map(c => `${c.firstName} ${c.lastName}`.trim())
        )
      } else {
        setCheckInReminders([])
      }
    }
    load()
  }, [user?.id, locale, reloadKey])

  // Re-load the aggregate stats whenever a watched child reports usage.
  useUsageRealtime(watchedIds, () => setReloadKey(k => k + 1))

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 p-6 text-white shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/30">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-200">{t('dashboard.welcomeBack')}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              {t('dashboard.welcome', { name: user?.name?.split(' ')[0] || '' })}
            </h1>
            <p className="mt-1 text-sm text-indigo-200">{t('dashboard.overview')}</p>
          </div>
          {user?.role !== 'admin' && (
            <Button className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-sm w-fit" asChild>
              <Link href="/dashboard/children">
                <Plus className="mr-2 h-4 w-4" />
                {t('children.addChild')}
              </Link>
            </Button>
          )}
        </div>
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 right-20 h-36 w-36 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-purple-500/30" />
      </div>

      {checkInReminders.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm">
              {t('dashboard.checkInReminder', { names: checkInReminders.join(', ') })}
            </p>
          </div>
          <Button variant="outline" size="sm" className="w-fit shrink-0" asChild>
            <Link href="/dashboard/statistics">
              {t('dashboard.checkInReminderAction')}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}

      <StatsCards
        childrenCount={stats.childrenCount}
        activeAppsCount={stats.activeAppsCount}
        todayUsageMinutes={stats.todayUsageMinutes}
        avgProgress={stats.avgProgress}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">{t('dashboard.weeklyProgress')}</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary" asChild>
              <Link href="/dashboard/statistics">
                {t('dashboard.viewAll')}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: tickColor, fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: tickColor, fontSize: 12 }}
                    label={{ value: 'min', angle: -90, position: 'insideLeft', fill: tickColor, fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', radius: 6 }}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: '10px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      color: isDark ? '#f1f5f9' : '#0f172a',
                    }}
                    formatter={(value: number) => [`${value} min`, t('dashboard.usageTooltip')]}
                  />
                  <Bar dataKey="usage" fill="#6366f1" radius={[6, 6, 0, 0]} minPointSize={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <ActivityFeed />
      </div>

      {/* Quick actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('dashboard.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.gradient} p-5 text-white shadow-md ${action.shadow} transition-all duration-200 hover:scale-[1.03] hover:shadow-lg`}
              >
                <action.icon className="h-7 w-7 opacity-90" />
                <p className="mt-3 font-semibold">{action.label}</p>
                <p className="text-xs opacity-75">{action.description}</p>
                <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform cards */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('dashboard.platformTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {platformCards.map((card) => (
            <div key={card.title} className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{card.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
              {card.href && (
                <Button variant="link" className="mt-2 h-auto p-0 text-primary" asChild>
                  <Link href={card.href}>
                    {t('common.open')} <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
