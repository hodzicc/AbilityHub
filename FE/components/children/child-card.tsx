'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useTranslation } from '@/components/providers'
import { calculateAge } from '@/lib/mock-data'
import type { Child } from '@/lib/types'
import { MoreHorizontal, Calendar, AppWindow } from 'lucide-react'
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

export function ChildCard({ child, progress = 0, onEdit, onDelete }: ChildCardProps) {
  const { t } = useTranslation()
  const age = calculateAge(child.dateOfBirth)

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  const getGenderColor = (gender: string) => {
    return gender === 'male' 
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Link href={`/dashboard/children/${child.id}`} className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(child.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                {child.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={getGenderColor(child.gender)}>
                  {t(`children.${child.gender}`)}
                </Badge>
              </div>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                {t('children.editChild')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive"
              >
                {t('children.deleteChild')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{age} {t('children.years')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AppWindow className="h-4 w-4" />
            <span>{child.assignedApps.length} {t('applications.assigned').toLowerCase()}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('children.progress')}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link href={`/dashboard/children/${child.id}`}>
            {t('children.childProfile')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
