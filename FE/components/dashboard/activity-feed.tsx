'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTranslation, useLanguage, useAuth } from '@/components/providers'
import { formatDistanceToNow } from 'date-fns'
import { bs, enUS } from 'date-fns/locale'
import { apiGetChildren, apiGetDashboard, apiGetApp, apiGetAdminDashboard, apiGetAllUsersUnpaged } from '@/lib/api'
import { ROLE_ID } from '@/lib/constants'
import { ACTIVITY_COLORS, ACTIVITY_ICONS, resolveActivityAction, describeActivity, type ActivityAction } from '@/lib/activity'
import { DEFAULT_APP_COLOR } from '@/lib/constants'

interface FeedItem {
  id: string
  childName: string
  appName: string
  appColor: string
  action: ActivityAction
  details: string
  timestamp: Date
}

export function ActivityFeed() {
  const { t } = useTranslation()
  const { locale } = useLanguage()
  const { user } = useAuth()
  const [items, setItems] = useState<FeedItem[]>([])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const appCache: Record<string, { name: string; color: string }> = {}
      const resolveApp = async (applicationId: string) => {
        if (!appCache[applicationId]) {
          const appData = await apiGetApp(applicationId).catch(() => null)
          appCache[applicationId] = {
            name: appData?.name ?? t('common.unknown'),
            color: appData?.color ?? DEFAULT_APP_COLOR,
          }
        }
        return appCache[applicationId]
      }

      const allItems: FeedItem[] = []

      if (user.role === 'admin') {
        // One aggregate call across all children (backend-computed), plus the child
        // directory (paged through in full, not capped at one page) to resolve
        // names — not a dashboard call per child.
        const [adminDash, allChildren] = await Promise.all([
          apiGetAdminDashboard().catch(() => null),
          apiGetAllUsersUnpaged(ROLE_ID.CHILD).catch(() => []),
        ])
        const childNameById = new Map(
          allChildren.map(u => [u.id, `${u.firstName} ${u.lastName}`.trim()])
        )

        for (const activity of adminDash?.recentActivities ?? []) {
          const app = await resolveApp(activity.applicationId)
          allItems.push({
            id: `${activity.childId}-${activity.occurredAt}-${activity.activityType}`,
            childName: childNameById.get(activity.childId) ?? t('common.unknown'),
            appName: app.name,
            appColor: app.color,
            action: resolveActivityAction(activity.activityType, activity.inProgress),
            details: describeActivity(activity, t),
            timestamp: new Date(activity.occurredAt),
          })
        }
      } else {
        const children = await apiGetChildren(user.id).catch(() => [])

        await Promise.all(
          children.map(async child => {
            const dash = await apiGetDashboard(child.id).catch(() => null)
            if (!dash) return
            const childName = `${child.firstName} ${child.lastName}`.trim()

            for (const activity of dash.recentActivities) {
              const app = await resolveApp(activity.applicationId)
              allItems.push({
                id: `${child.id}-${activity.occurredAt}-${activity.activityType}`,
                childName,
                appName: app.name,
                appColor: app.color,
                action: resolveActivityAction(activity.activityType, activity.inProgress),
                details: describeActivity(activity, t),
                timestamp: new Date(activity.occurredAt),
              })
            }
          })
        )
      }

      allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      setItems(allItems.slice(0, 10))
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('dashboard.recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-4 pt-0">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('dashboard.noRecentActivity')}
              </p>
            ) : (
              items.map(item => {
                const Icon = ACTIVITY_ICONS[item.action]
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {item.childName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{item.childName}</span>
                        <Badge variant="secondary" className={ACTIVITY_COLORS[item.action]}>
                          <Icon className={`h-3 w-3 mr-1 ${item.action === 'inProgress' ? 'animate-spin' : ''}`} />
                          {t(`dashboard.actions.${item.action}`)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.appName} - {item.details}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(item.timestamp, {
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
