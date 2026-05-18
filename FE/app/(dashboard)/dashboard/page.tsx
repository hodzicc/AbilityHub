'use client'

import Link from 'next/link'
import { useAuth, useTranslation } from '@/components/providers'
import { PageHeader } from '@/components/shared'
import { StatsCards, ActivityFeed } from '@/components/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { mockChildren, mockApplications, mockDailyUsage, mockChildProgress } from '@/lib/mock-data'
import {
  Plus,
  ArrowRight,
  Users,
  AppWindow,
  BarChart3,
  Settings,
  PlugZap,
  ShieldCheck,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useTranslation()

  const childrenCount = mockChildren.length
  const activeAppsCount = mockApplications.filter(app => app.isActive).length
  const today = new Date().toISOString().split('T')[0]
  const todayUsage = mockDailyUsage
    .filter(usage => usage.date === today)
    .reduce((sum, usage) => sum + usage.duration, 0)
  const avgProgress = Math.round(
    mockChildProgress.reduce((sum, progress) => sum + progress.score, 0) / mockChildProgress.length
  )

  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    return date.toISOString().split('T')[0]
  })

  const weeklyData = last7Days.map(date => {
    const dayUsage = mockDailyUsage
      .filter(usage => usage.date === date)
      .reduce((sum, usage) => sum + usage.duration, 0)
    const dayName = new Date(date).toLocaleDateString('bs-BA', { weekday: 'short' })

    return {
      name: dayName,
      usage: dayUsage,
    }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dashboard.welcome', { name: user?.name?.split(' ')[0] || '' })}
        description={t('dashboard.overview')}
      >
        <Button asChild>
          <Link href="/dashboard/children">
            <Plus className="mr-2 h-4 w-4" />
            {t('children.addChild')}
          </Link>
        </Button>
      </PageHeader>

      <StatsCards
        childrenCount={childrenCount}
        activeAppsCount={activeAppsCount}
        todayUsageMinutes={todayUsage}
        avgProgress={avgProgress}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('dashboard.weeklyProgress')}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/statistics">
                {t('dashboard.viewAll')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    label={{
                      value: 'min',
                      angle: -90,
                      position: 'insideLeft',
                      fill: 'hsl(var(--muted-foreground))',
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Bar dataKey="usage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <ActivityFeed />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('dashboard.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/dashboard/children">
                <Users className="mb-2 h-6 w-6" />
                <span>{t('nav.children')}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/dashboard/applications">
                <AppWindow className="mb-2 h-6 w-6" />
                <span>{t('nav.applications')}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/dashboard/statistics">
                <BarChart3 className="mb-2 h-6 w-6" />
                <span>{t('nav.statistics')}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/dashboard/settings">
                <Settings className="mb-2 h-6 w-6" />
                <span>{t('nav.settings')}</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platforma za integraciju</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-medium">Jedinstvena prijava</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Roditelji, administratori i djeca koriste isti identitet kroz povezane aplikacije.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PlugZap className="h-5 w-5" />
            </div>
            <h3 className="font-medium">Status integracija</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pratite koje aplikacije su spremne, koje trebaju adapter i koje su u izradi.
            </p>
            <Button variant="link" className="mt-2 h-auto p-0" asChild>
              <Link href="/dashboard/integrations">Otvori integracije</Link>
            </Button>
          </div>
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <h3 className="font-medium">Sinhronizovane preferencije</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Boje, font i pristupačnost se šalju svim referentnim aplikacijama.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
