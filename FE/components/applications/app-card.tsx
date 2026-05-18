'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/components/providers'
import type { Application } from '@/lib/types'
import { 
  BookOpen, 
  Calculator, 
  MessageCircle, 
  Palette, 
  Clock, 
  Gamepad2,
  ArrowRight
} from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  BookOpen,
  Calculator,
  MessageCircle,
  Palette,
  Clock,
  Gamepad2
}

const integrationStatusLabel = {
  ready: 'Integrisano',
  'in-progress': 'U integraciji',
  'needs-adapter': 'Treba adapter',
}

interface AppCardProps {
  app: Application
  assignedCount?: number
}

export function AppCard({ app, assignedCount = 0 }: AppCardProps) {
  const { t } = useTranslation()
  const Icon = iconMap[app.icon] || BookOpen

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
              style={{ backgroundColor: app.color + '20', color: app.color }}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-base group-hover:text-primary transition-colors">
                {app.name}
              </CardTitle>
              <Badge variant="secondary" className="mt-1">
                {t(`applications.categories.${app.category}`)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {app.description}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('applications.ageRange')}</span>
          <span className="font-medium">{app.minAge}-{app.maxAge} {t('children.years')}</span>
        </div>

        {assignedCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('applications.assigned')}</span>
            <Badge variant="outline">{assignedCount} djece</Badge>
          </div>
        )}

        {app.integrationStatus && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Integracija</span>
            <Badge variant={app.integrationStatus === 'ready' ? 'default' : 'secondary'}>
              {integrationStatusLabel[app.integrationStatus]}
            </Badge>
          </div>
        )}

        <Button variant="outline" className="w-full" asChild>
          <Link href={`/dashboard/applications/${app.id}`}>
            {t('applications.details')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
