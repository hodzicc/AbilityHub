'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/components/providers'
import { cn } from '@/lib/utils'
import { Users, AppWindow, Clock, TrendingUp, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface StatsCardsProps {
  childrenCount: number
  activeAppsCount: number
  todayUsageMinutes: number
  avgProgress: number
}

export function StatsCards({ childrenCount, activeAppsCount, todayUsageMinutes, avgProgress }: StatsCardsProps) {
  const { t } = useTranslation()

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} ${t('dashboard.minutes')}`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) {
      return `${hours} ${t('dashboard.hours')}`
    }
    return `${hours}h ${mins}m`
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t('dashboard.totalChildren')}
        value={childrenCount}
        icon={Users}
        trend={{ value: 0, isPositive: true }}
      />
      <StatCard
        title={t('dashboard.activeApps')}
        value={activeAppsCount}
        icon={AppWindow}
      />
      <StatCard
        title={t('dashboard.todayUsage')}
        value={formatDuration(todayUsageMinutes)}
        icon={Clock}
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        title={t('dashboard.avgProgress')}
        value={`${avgProgress}%`}
        icon={TrendingUp}
        trend={{ value: 5, isPositive: true }}
      />
    </div>
  )
}
