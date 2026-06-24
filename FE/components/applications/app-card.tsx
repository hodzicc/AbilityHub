'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/components/providers'
import type { Application } from '@/lib/types'
import { ArrowRight, Users, Pencil, Power, PowerOff } from 'lucide-react'
import { getAppIcon } from '@/lib/app-icons'
import { DEFAULT_APP_COLOR } from '@/lib/constants'

interface AppCardProps {
  app: Application
  assignedCount?: number
  isAdmin?: boolean
  onEdit?: () => void
  onToggleActive?: () => void
}

export function AppCard({ app, assignedCount = 0, isAdmin = false, onEdit, onToggleActive }: AppCardProps) {
  const { t } = useTranslation()
  const Icon = getAppIcon(app.icon)
  const color = app.color || DEFAULT_APP_COLOR

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
              <Badge variant="secondary" className="text-xs">{t('common.inactive')}</Badge>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{app.description}</p>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('applications.ageRange')}</span>
          <span className="font-medium">{app.minAge}-{app.maxAge} {t('children.years')}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 group/btn hover:border-primary hover:text-primary"
            asChild
          >
            <Link href={`/dashboard/applications/${app.id}`}>
              {t('applications.details')}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          </Button>
          {isAdmin && onEdit && (
            <Button variant="outline" size="icon" className="shrink-0" title={t('applications.editApp')} onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {isAdmin && onToggleActive && (
            <Button
              variant="outline"
              size="icon"
              className={`shrink-0 ${app.isActive ? 'text-destructive hover:text-destructive' : ''}`}
              title={app.isActive ? t('applications.deactivateApp') : t('applications.activateApp')}
              onClick={onToggleActive}
            >
              {app.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
