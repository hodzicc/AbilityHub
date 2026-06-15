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
import { formatDuration } from '@/lib/utils'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Clock, TrendingUp, Calendar, Download, Play, CheckCircle, Pause, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import {
  apiGetChildren,
  apiGetDashboard,
  apiGetApp,
  type DashboardResponse,
  type UserProfileResponse,
} from '@/lib/api'

const actionIcons = {
  started: Play,
  completed: CheckCircle,
  paused: Pause,
  achievement: Trophy,
}

function activityTypeToAction(type: string): keyof typeof actionIcons {
  const t = type.toLowerCase()
  if (t.includes('start') || t.includes('session')) return 'started'
  if (t.includes('achiev') || t.includes('badge')) return 'achievement'
  if (t.includes('paus')) return 'paused'
  return 'completed'
}

interface ChildData {
  profile: UserProfileResponse
  dashboard: DashboardResponse | null
}

export default function StatisticsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [childrenData, setChildrenData] = useState<ChildData[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('all')
  const [appNames, setAppNames] = useState<Record<string, { name: string; color: string }>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
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

        // Collect unique app IDs and fetch names
        const appIds = new Set<string>()
        data.forEach(d => d.dashboard?.perApp.forEach(a => appIds.add(a.applicationId)))
        data.forEach(d => d.dashboard?.recentActivities.forEach(a => appIds.add(a.applicationId)))

        const names: Record<string, { name: string; color: string }> = {}
        await Promise.all(
          Array.from(appIds).map(async id => {
            const app = await apiGetApp(id).catch(() => null)
            names[id] = { name: app?.name ?? 'Unknown', color: app?.color ?? '#4F46E5' }
          })
        )
        setAppNames(names)
      } catch {
        toast.error('Greška pri učitavanju statistike')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [user?.id])

  // Filtered dashboards based on selected child
  const filteredDashboards = useMemo(() => {
    if (selectedChild === 'all') return childrenData.map(d => d.dashboard).filter(Boolean) as DashboardResponse[]
    return childrenData
      .filter(d => d.profile.id === selectedChild)
      .map(d => d.dashboard)
      .filter(Boolean) as DashboardResponse[]
  }, [childrenData, selectedChild])

  const stats = useMemo(() => {
    const totalMinutes = filteredDashboards.reduce((s, d) => s + d.totalUsageMinutes, 0)
    const totalActivities = filteredDashboards.reduce((s, d) => s + d.activityCount, 0)
    const totalSessions = filteredDashboards.reduce(
      (s, d) => s + d.perApp.reduce((ps, a) => ps + a.sessionCount, 0),
      0
    )
    return { totalMinutes, totalActivities, totalSessions }
  }, [filteredDashboards])

  // Usage by app (pie chart)
  const usageByApp = useMemo(() => {
    const grouped: Record<string, number> = {}
    filteredDashboards.forEach(d =>
      d.perApp.forEach(a => {
        grouped[a.applicationId] = (grouped[a.applicationId] ?? 0) + a.totalMinutes
      })
    )
    return Object.entries(grouped)
      .map(([appId, value]) => ({
        name: appNames[appId]?.name ?? 'Unknown',
        value,
        color: appNames[appId]?.color ?? '#666',
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredDashboards, appNames])

  // Per-app bar chart
  const appBarData = useMemo(() => {
    return usageByApp.map(a => ({ name: a.name.slice(0, 12), usage: a.value, color: a.color }))
  }, [usageByApp])

  // Recent activity
  const recentActivities = useMemo(() => {
    const acts: Array<{
      id: string
      childName: string
      appId: string
      type: string
      detail: string
      occurredAt: Date
    }> = []
    filteredDashboards.forEach((d, i) => {
      const childProfile = selectedChild === 'all'
        ? childrenData.find(cd => cd.dashboard?.childId === d.childId)?.profile
        : childrenData.find(cd => cd.profile.id === selectedChild)?.profile
      const childName = childProfile
        ? `${childProfile.firstName} ${childProfile.lastName}`.trim()
        : 'Unknown'
      d.recentActivities.forEach((a, j) => {
        acts.push({
          id: `${i}-${j}`,
          childName,
          appId: a.applicationId,
          type: a.activityType,
          detail: a.detail ?? a.name,
          occurredAt: new Date(a.occurredAt),
        })
      })
    })
    return acts.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()).slice(0, 15)
  }, [filteredDashboards, childrenData, selectedChild])

  const handleExport = () => {
    toast.success('Izvještaj je uspješno izvezen')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('statistics.title')}
        description={t('statistics.subtitle')}
      >
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          {t('statistics.exportReport')}
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              Broj aktivnosti
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      ) : (
        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList>
            <TabsTrigger value="usage">{t('statistics.usage')}</TabsTrigger>
            <TabsTrigger value="activity">{t('statistics.activity')}</TabsTrigger>
          </TabsList>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Korištenje po aplikaciji (min)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={appBarData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`${value} min`, 'Korištenje']}
                        />
                        <Bar dataKey="usage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                          {appBarData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Udio po aplikaciji</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={usageByApp}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {usageByApp.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`${value} min`, 'Korištenje']}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('dashboard.recentActivity')}</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nema zabilježenih aktivnosti
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map(activity => {
                      const app = appNames[activity.appId]
                      const action = activityTypeToAction(activity.type)
                      const Icon = actionIcons[action]
                      return (
                        <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                            style={{ backgroundColor: (app?.color ?? '#666') + '20', color: app?.color ?? '#666' }}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{activity.childName}</span>
                              <Badge variant="secondary">{app?.name ?? 'Unknown'}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{activity.detail}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.occurredAt.toLocaleString('bs-BA')}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
