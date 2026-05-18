'use client'

import { useState, useMemo } from 'react'
import { useTranslation, useLanguage } from '@/components/providers'
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
import { 
  mockChildren, 
  mockApplications, 
  mockDailyUsage,
  mockChildProgress,
  mockActivityLogs,
  formatDuration
} from '@/lib/mock-data'
import { formatDistanceToNow } from 'date-fns'
import { bs, enUS } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { Clock, TrendingUp, Trophy, Calendar, Download, Play, CheckCircle, Pause } from 'lucide-react'
import { toast } from 'sonner'

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4']

const actionIcons = {
  started: Play,
  completed: CheckCircle,
  paused: Pause,
  achievement: Trophy
}

export default function StatisticsPage() {
  const { t } = useTranslation()
  const { locale } = useLanguage()
  const [selectedChild, setSelectedChild] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly')

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    const end = new Date()
    const start = new Date()
    
    switch (timeRange) {
      case 'daily':
        start.setDate(start.getDate() - 7)
        break
      case 'weekly':
        start.setDate(start.getDate() - 28)
        break
      case 'monthly':
        start.setMonth(start.getMonth() - 3)
        break
    }
    
    return { start, end }
  }, [timeRange])

  // Filter usage data
  const filteredUsage = useMemo(() => {
    return mockDailyUsage.filter(u => {
      const date = new Date(u.date)
      const inRange = date >= dateRange.start && date <= dateRange.end
      const matchesChild = selectedChild === 'all' || u.childId === selectedChild
      return inRange && matchesChild
    })
  }, [selectedChild, dateRange])

  // Usage by date for line chart
  const usageByDate = useMemo(() => {
    const grouped: Record<string, number> = {}
    
    filteredUsage.forEach(u => {
      if (!grouped[u.date]) grouped[u.date] = 0
      grouped[u.date] += u.duration
    })
    
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14) // Last 14 data points
      .map(([date, duration]) => ({
        date: new Date(date).toLocaleDateString('bs-BA', { day: '2-digit', month: '2-digit' }),
        duration
      }))
  }, [filteredUsage])

  // Usage by app for pie chart
  const usageByApp = useMemo(() => {
    const grouped: Record<string, number> = {}
    
    filteredUsage.forEach(u => {
      if (!grouped[u.appId]) grouped[u.appId] = 0
      grouped[u.appId] += u.duration
    })
    
    return Object.entries(grouped).map(([appId, duration]) => {
      const app = mockApplications.find(a => a.id === appId)
      return {
        name: app?.name || 'Unknown',
        value: duration,
        color: app?.color || '#666'
      }
    }).sort((a, b) => b.value - a.value)
  }, [filteredUsage])

  // Progress data for selected child or all
  const progressData = useMemo(() => {
    const filtered = selectedChild === 'all' 
      ? mockChildProgress 
      : mockChildProgress.filter(p => p.childId === selectedChild)
    
    // Group by app and average
    const grouped: Record<string, { total: number; count: number }> = {}
    
    filtered.forEach(p => {
      if (!grouped[p.appId]) grouped[p.appId] = { total: 0, count: 0 }
      grouped[p.appId].total += p.score
      grouped[p.appId].count++
    })
    
    return Object.entries(grouped).map(([appId, data]) => {
      const app = mockApplications.find(a => a.id === appId)
      return {
        name: app?.name || 'Unknown',
        progress: Math.round(data.total / data.count),
        color: app?.color || '#666'
      }
    })
  }, [selectedChild])

  // Stats summary
  const stats = useMemo(() => {
    const totalMinutes = filteredUsage.reduce((sum, u) => sum + u.duration, 0)
    const totalSessions = filteredUsage.reduce((sum, u) => sum + u.sessionsCount, 0)
    const daysWithActivity = new Set(filteredUsage.map(u => u.date)).size
    const avgDaily = daysWithActivity > 0 ? Math.round(totalMinutes / daysWithActivity) : 0
    
    const relevantProgress = selectedChild === 'all' 
      ? mockChildProgress 
      : mockChildProgress.filter(p => p.childId === selectedChild)
    const avgProgress = relevantProgress.length > 0
      ? Math.round(relevantProgress.reduce((sum, p) => sum + p.score, 0) / relevantProgress.length)
      : 0

    return {
      totalMinutes,
      totalSessions,
      avgDaily,
      avgProgress
    }
  }, [filteredUsage, selectedChild])

  // Activity logs
  const filteredLogs = useMemo(() => {
    if (selectedChild === 'all') return mockActivityLogs
    return mockActivityLogs.filter(l => l.childId === selectedChild)
  }, [selectedChild])

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
            {mockChildren.map(child => (
              <SelectItem key={child.id} value={child.id}>
                {child.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {t(`statistics.${range}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              {t('statistics.avgDaily')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDaily} min</div>
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
              {t('dashboard.avgProgress')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProgress}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="usage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="usage">{t('statistics.usage')}</TabsTrigger>
          <TabsTrigger value="progress">{t('statistics.progress')}</TabsTrigger>
          <TabsTrigger value="activity">{t('statistics.activity')}</TabsTrigger>
        </TabsList>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Usage Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Korištenje tokom vremena</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageByDate}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`${value} min`, 'Korištenje']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="duration" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Usage by App */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Korištenje po aplikaciji</CardTitle>
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
                          borderRadius: '8px'
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

        {/* Progress Tab */}
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Napredak po aplikaciji</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progressData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]}
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={120}
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value}%`, 'Napredak']}
                    />
                    <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
                      {progressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('dashboard.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLogs.slice(0, 15).map(log => {
                  const child = mockChildren.find(c => c.id === log.childId)
                  const app = mockApplications.find(a => a.id === log.appId)
                  const Icon = actionIcons[log.action]
                  
                  return (
                    <div key={log.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div 
                        className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                        style={{ backgroundColor: app?.color + '20', color: app?.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{child?.name}</span>
                          <Badge variant="secondary">{app?.name}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(log.timestamp, { 
                            addSuffix: true,
                            locale: locale === 'bs' ? bs : enUS
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
