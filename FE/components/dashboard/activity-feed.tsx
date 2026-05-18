'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTranslation } from '@/components/providers'
import { mockActivityLogs, mockChildren, mockApplications } from '@/lib/mock-data'
import { formatDistanceToNow } from 'date-fns'
import { bs, enUS } from 'date-fns/locale'
import { useLanguage } from '@/components/providers'
import { Trophy, Play, CheckCircle, Pause } from 'lucide-react'

const actionIcons = {
  started: Play,
  completed: CheckCircle,
  paused: Pause,
  achievement: Trophy
}

const actionColors = {
  started: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  achievement: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
}

export function ActivityFeed() {
  const { t } = useTranslation()
  const { locale } = useLanguage()
  
  const getChildName = (childId: string) => {
    return mockChildren.find(c => c.id === childId)?.name || 'Unknown'
  }

  const getAppName = (appId: string) => {
    return mockApplications.find(a => a.id === appId)?.name || 'Unknown'
  }

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  const recentLogs = mockActivityLogs.slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('dashboard.recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-4 pt-0">
            {recentLogs.map((log) => {
              const Icon = actionIcons[log.action]
              const childName = getChildName(log.childId)
              const appName = getAppName(log.appId)
              
              return (
                <div 
                  key={log.id} 
                  className="flex items-start gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(childName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{childName}</span>
                      <Badge variant="secondary" className={actionColors[log.action]}>
                        <Icon className="h-3 w-3 mr-1" />
                        {log.action}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {appName} - {log.details}
                    </p>
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
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
