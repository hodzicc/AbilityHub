'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from '@/components/providers'
import { cn } from '@/lib/utils'
import { Users, AppWindow, Clock, TrendingUp, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  gradient: string
  iconBg: string
  iconColor: string
}

function StatCard({ title, value, description, icon: Icon, gradient, iconBg, iconColor }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden border-0 shadow-sm', gradient)}>
      <CardContent className="pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            {description && (
              <p className="mt-1 text-xs text-white/70">{description}</p>
            )}
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
      {/* Decorative circle */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-white/5" />
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
    if (minutes < 60) return `${minutes} ${t('dashboard.minutes')}`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours} ${t('dashboard.hours')}`
    return `${hours}h ${mins}m`
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t('dashboard.totalChildren')}
        value={childrenCount}
        description={t('dashboard.totalChildrenDesc')}
        icon={Users}
        gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
        iconBg="bg-white/20"
        iconColor="text-white"
      />
      <StatCard
        title={t('dashboard.activeApps')}
        value={activeAppsCount}
        description={t('dashboard.activeAppsDesc')}
        icon={AppWindow}
        gradient="bg-gradient-to-br from-orange-400 to-orange-600"
        iconBg="bg-white/20"
        iconColor="text-white"
      />
      <StatCard
        title={t('dashboard.todayUsage')}
        value={formatDuration(todayUsageMinutes)}
        description={t('dashboard.todayUsageDesc')}
        icon={Clock}
        gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
        iconBg="bg-white/20"
        iconColor="text-white"
      />
      <StatCard
        title={t('dashboard.avgProgress')}
        value={`${avgProgress}%`}
        description={t('dashboard.avgProgressDesc')}
        icon={TrendingUp}
        gradient="bg-gradient-to-br from-amber-400 to-amber-600"
        iconBg="bg-white/20"
        iconColor="text-white"
      />
    </div>
  )
}
