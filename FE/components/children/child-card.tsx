'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useTranslation } from '@/components/providers'
import { calculateAge } from '@/lib/utils'
import type { Child } from '@/lib/types'
import { MoreHorizontal, Calendar, AppWindow, ChevronRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ChildCardProps {
  child: Child
  progress?: number
  onEdit?: () => void
  onDelete?: () => void
}

const AVATAR_GRADIENTS = [
  'from-indigo-400 to-indigo-600',
  'from-orange-400 to-orange-500',
  'from-emerald-400 to-emerald-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-amber-400 to-amber-500',
  'from-teal-400 to-teal-600',
]

function avatarGradient(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[idx]
}

export function ChildCard({ child, progress = 0, onEdit, onDelete }: ChildCardProps) {
  const { t } = useTranslation()
  const age = calculateAge(child.dateOfBirth)
  const gradient = avatarGradient(child.name)

  return (
    <Card className="group overflow-hidden border-0 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* Colored top strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between">
          <Link href={`/dashboard/children/${child.id}`} className="flex items-center gap-3">
            <Avatar className="h-12 w-12 shadow-sm">
              <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white font-semibold text-sm`}>
                {child.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                {child.name}
              </h3>
              <Badge
                variant="secondary"
                className={
                  child.gender === 'male'
                    ? 'mt-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0'
                    : 'mt-1 bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-0'
                }
              >
                {t(`children.${child.gender}`)}
              </Badge>
            </div>
          </Link>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label={t('common.moreActions')}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>{t('children.editChild')}</DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    {t('children.deleteChild')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
            <Calendar className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-muted-foreground">{age} {t('children.years')}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
            <AppWindow className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-muted-foreground">{child.assignedApps.length} {t('applications.assigned').toLowerCase()}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('children.progress')}</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Button variant="outline" size="sm" className="w-full group/btn hover:border-primary hover:text-primary" asChild>
          <Link href={`/dashboard/children/${child.id}`}>
            {t('children.childProfile')}
            <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
