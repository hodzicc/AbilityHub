'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
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
  AppWindow,
  ArrowRight,
  Users,
} from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  BookOpen, Calculator, MessageCircle, Palette, Clock, Gamepad2, AppWindow,
}

interface AppCardProps {
  app: Application
  assignedCount?: number
}

export function AppCard({ app, assignedCount = 0 }: AppCardProps) {
  const { t } = useTranslation()
  const Icon = iconMap[app.icon] || AppWindow
  const color = app.color || '#6366f1'

  return (
    <Card className="group overflow-hidden border-0 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* Colored banner */}
      <div
        className="h-24 w-full flex items-end px-5 pb-0"
        style={{ background: `linear-gradient(135deg, ${color}22 0%, ${color}44 100%)` }}
      >
        <div
          className="flex h-14 w-14 translate-y-7 items-center justify-center rounded-2xl shadow-lg transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: color, color: '#fff' }}
        >
          <Icon className="h-7 w-7" />
        </div>
      </div>

      <CardContent className="pt-10 pb-5 space-y-3">
        <div>
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
            {app.name}
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <Badge
              variant="secondary"
              className="text-xs border-0"
              style={{ backgroundColor: color + '18', color }}
            >
              {t(`applications.categories.${app.category}`)}
            </Badge>
            {!app.isActive && (
              <Badge variant="secondary" className="text-xs">Neaktivna</Badge>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{app.description}</p>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('applications.ageRange')}</span>
          <span className="font-medium">{app.minAge}–{app.maxAge} {t('children.years')}</span>
        </div>

        {assignedCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{assignedCount} {assignedCount === 1 ? 'dijete' : 'djece'}</span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-1 group/btn hover:border-primary hover:text-primary"
          asChild
        >
          <Link href={`/dashboard/applications/${app.id}`}>
            {t('applications.details')}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
