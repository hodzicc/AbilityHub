'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTranslation, useLanguage, useAuth } from '@/components/providers'
import { formatDistanceToNow } from 'date-fns'
import { bs, enUS } from 'date-fns/locale'
import { Trophy, Play, CheckCircle, Pause } from 'lucide-react'
import { apiGetChildren, apiGetDashboard, apiGetApp, type RecentActivityDto } from '@/lib/api'

interface FeedItem {
  id: string
  childName: string
  appName: string
  appColor: string
  action: 'started' | 'completed' | 'paused' | 'achievement'
  details: string
  timestamp: Date
}

const actionColors = {
  started: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  achievement: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const actionIcons = {
  started: Play,
  completed: CheckCircle,
  paused: Pause,
  achievement: Trophy,
}

function activityTypeToAction(type: string): FeedItem['action'] {
  const t = type.toLowerCase()
  if (t.includes('start') || t.includes('session')) return 'started'
  if (t.includes('achiev') || t.includes('badge') || t.includes('reward')) return 'achievement'
  if (t.includes('paus')) return 'paused'
  return 'completed'
}

export function ActivityFeed() {
  const { t } = useTranslation()
  const { locale } = useLanguage()
  const { user } = useAuth()
  const [items, setItems] = useState<FeedItem[]>([])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const children = await apiGetChildren(user.id).catch(() => [])
      const appCache: Record<string, { name: string; color: string }> = {}

      const allItems: FeedItem[] = []

      await Promise.all(
        children.map(async child => {
          const dash = await apiGetDashboard(child.id).catch(() => null)
          if (!dash) return
          const childName = `${child.firstName} ${child.lastName}`.trim()

          for (const activity of dash.recentActivities) {
            if (!appCache[activity.applicationId]) {
              const appData = await apiGetApp(activity.applicationId).catch(() => null)
              appCache[activity.applicationId] = {
                name: appData?.name ?? 'Unknown',
                color: appData?.color ?? '#4F46E5',
              }
            }
            const app = appCache[activity.applicationId]
            allItems.push({
              id: `${child.id}-${activity.occurredAt}-${activity.activityType}`,
              childName,
              appName: app.name,
              appColor: app.color,
              action: activityTypeToAction(activity.activityType),
              details: activity.detail ?? activity.name,
              timestamp: new Date(activity.occurredAt),
            })
          }
        })
      )

      allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      setItems(allItems.slice(0, 10))
    }
    load()
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
                const Icon = actionIcons[item.action]
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
                        <Badge variant="secondary" className={actionColors[item.action]}>
                          <Icon className="h-3 w-3 mr-1" />
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
