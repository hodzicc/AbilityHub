'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/components/providers'
import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  mockChildren, 
  mockApplications, 
  mockAppAssignments, 
  mockChildProgress,
  mockDailyUsage,
  calculateAge,
  formatDuration
} from '@/lib/mock-data'
import { ArrowLeft, Calendar, Clock, Trophy, AppWindow } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function ChildProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t } = useTranslation()

  const child = mockChildren.find(c => c.id === id)
  
  if (!child) {
    notFound()
  }

  const age = calculateAge(child.dateOfBirth)
  
  // Get assigned apps with details
  const assignments = mockAppAssignments.filter(a => a.childId === id)
  const assignedApps = assignments.map(assignment => {
    const app = mockApplications.find(a => a.id === assignment.appId)
    const progress = mockChildProgress.find(p => p.childId === id && p.appId === assignment.appId)
    return { ...assignment, app, progress }
  }).filter(a => a.app)

  // Calculate overall progress
  const progressData = mockChildProgress.filter(p => p.childId === id)
  const overallProgress = progressData.length > 0
    ? Math.round(progressData.reduce((sum, p) => sum + p.score, 0) / progressData.length)
    : 0

  // Get usage data for last 14 days
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (13 - i))
    return date.toISOString().split('T')[0]
  })

  const usageChartData = last14Days.map(date => {
    const dayUsage = mockDailyUsage
      .filter(u => u.date === date && u.childId === id)
      .reduce((sum, u) => sum + u.duration, 0)
    
    return {
      date: new Date(date).toLocaleDateString('bs-BA', { day: '2-digit', month: '2-digit' }),
      usage: dayUsage
    }
  })

  // Total usage
  const totalUsage = assignments.reduce((sum, a) => sum + a.totalUsageTime, 0)

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase()

  const getGenderColor = (gender: string) => {
    return gender === 'male' 
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
  }

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

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar className="h-24 w-24 mx-auto sm:mx-0">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
                {getInitials(child.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold">{child.name}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                <Badge variant="secondary" className={getGenderColor(child.gender)}>
                  {t(`children.${child.gender}`)}
                </Badge>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {age} {t('children.years')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{assignedApps.length}</p>
                <p className="text-xs text-muted-foreground">{t('applications.assigned')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatDuration(totalUsage)}</p>
                <p className="text-xs text-muted-foreground">{t('children.totalUsage')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{overallProgress}%</p>
                <p className="text-xs text-muted-foreground">{t('children.progress')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="apps" className="space-y-6">
        <TabsList>
          <TabsTrigger value="apps">{t('children.assignedApps')}</TabsTrigger>
          <TabsTrigger value="progress">{t('children.progress')}</TabsTrigger>
        </TabsList>

        {/* Assigned Apps Tab */}
        <TabsContent value="apps" className="space-y-4">
          {assignedApps.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assignedApps.map(({ app, progress, ...assignment }) => (
                <Card key={assignment.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: app!.color + '20', color: app!.color }}
                      >
                        <AppWindow className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{app!.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {t(`applications.categories.${app!.category}`)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {t('children.totalUsage')}
                      </span>
                      <span className="font-medium">{formatDuration(assignment.totalUsageTime)}</span>
                    </div>
                    {assignment.dailyTimeLimit > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('applications.dailyLimit')}</span>
                        <span className="font-medium">{assignment.dailyTimeLimit} min</span>
                      </div>
                    )}
                    {progress && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Trophy className="h-3.5 w-3.5" />
                            Level {progress.level}
                          </span>
                          <span className="font-medium">{progress.score}%</span>
                        </div>
                        <Progress value={progress.score} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">{t('children.noAppsAssigned')}</p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/applications">{t('children.assignApps')}</Link>
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('statistics.usage')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageChartData}>
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
                    />
                    <Area 
                      type="monotone" 
                      dataKey="usage" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Progress per app */}
          <div className="grid gap-4 sm:grid-cols-2">
            {progressData.map(progress => {
              const app = mockApplications.find(a => a.id === progress.appId)
              if (!app) return null
              
              return (
                <Card key={`${progress.childId}-${progress.appId}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: app.color + '20', color: app.color }}
                        >
                          <AppWindow className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{app.name}</span>
                      </div>
                      <Badge variant="secondary">Level {progress.level}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {progress.completedActivities}/{progress.totalActivities} aktivnosti
                        </span>
                        <span className="font-medium">{progress.score}%</span>
                      </div>
                      <Progress value={progress.score} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
