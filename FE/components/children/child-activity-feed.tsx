'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTranslation, useLanguage } from '@/components/providers'
import { formatDistanceToNow } from 'date-fns'
import { bs, enUS } from 'date-fns/locale'
import { AppWindow } from 'lucide-react'
import { ACTIVITY_COLORS, ACTIVITY_ICONS, resolveActivityAction, describeActivity } from '@/lib/activity'
import type { RecentActivityDto } from '@/lib/api'
import type { Application } from '@/lib/types'
import { DEFAULT_APP_COLOR } from '@/lib/constants'

interface ChildActivityFeedProps {
  activities: RecentActivityDto[]
  apps: Application[]
}

/**
 * Recent-activity list scoped to a single child — same look as the dashboard
 * ActivityFeed, but without the per-child avatar/name column since the whole
 * card is already in that child's profile context.
 */
export function ChildActivityFeed({ activities, apps }: ChildActivityFeedProps) {
  const { t } = useTranslation()
  const { locale } = useLanguage()

  const appById = useMemo(
    () => Object.fromEntries(apps.map(a => [a.id, a])),
    [apps]
  )

  const sorted = useMemo(
    () => [...activities]
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 10),
    [activities]
  )

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{t('dashboard.recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[360px]">
          <div className="space-y-1 p-4 pt-0">
            {sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('dashboard.noRecentActivity')}
              </p>
            ) : (
              sorted.map(activity => {
                const action = resolveActivityAction(activity.activityType, activity.inProgress)
                const Icon = ACTIVITY_ICONS[action]
                const app = appById[activity.applicationId]
                const color = app?.color ?? DEFAULT_APP_COLOR
                return (
                  <div
                    key={`${activity.applicationId}-${activity.occurredAt}-${activity.activityType}`}
                    className="flex items-start gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: color + '1A', color }}
                    >
                      <AppWindow className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{app?.name ?? activity.name}</span>
                        <Badge variant="secondary" className={ACTIVITY_COLORS[action]}>
                          <Icon className={`h-3 w-3 mr-1 ${action === 'inProgress' ? 'animate-spin' : ''}`} />
                          {t(`dashboard.actions.${action}`)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {describeActivity(activity, t)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.occurredAt), {
                          addSuffix: true,
                          locale: locale === 'bs' ? bs : enUS,
                        })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
