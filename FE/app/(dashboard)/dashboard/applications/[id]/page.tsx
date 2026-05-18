'use client'

import { use, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/components/providers'
import { PageHeader, ConfirmationDialog } from '@/components/shared'
import { AssignAppDialog } from '@/components/applications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  mockApplications, 
  mockAppAssignments, 
  mockChildren,
  mockChildProgress,
  formatDuration
} from '@/lib/mock-data'
import { 
  ArrowLeft, 
  Plus, 
  Clock, 
  Users, 
  Calendar,
  BookOpen,
  Calculator,
  MessageCircle,
  Palette,
  Gamepad2,
  Trash2,
  PlugZap
} from 'lucide-react'
import { toast } from 'sonner'

const iconMap: Record<string, React.ElementType> = {
  BookOpen,
  Calculator,
  MessageCircle,
  Palette,
  Clock,
  Gamepad2
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t } = useTranslation()
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [removeAssignment, setRemoveAssignment] = useState<string | null>(null)
  const [assignments, setAssignments] = useState(
    mockAppAssignments.filter(a => a.appId === id)
  )

  const app = mockApplications.find(a => a.id === id)
  
  if (!app) {
    notFound()
  }

  const Icon = iconMap[app.icon] || BookOpen

  // Get assigned children with details
  const assignedChildren = assignments.map(assignment => {
    const child = mockChildren.find(c => c.id === assignment.childId)
    const progress = mockChildProgress.find(p => p.childId === assignment.childId && p.appId === id)
    return { ...assignment, child, progress }
  }).filter(a => a.child)

  const handleAssign = (childId: string, timeLimit: number) => {
    const newAssignment = {
      id: `assign-${Date.now()}`,
      childId,
      appId: id,
      isActive: true,
      dailyTimeLimit: timeLimit,
      totalUsageTime: 0,
      createdAt: new Date()
    }
    setAssignments(prev => [...prev, newAssignment])
  }

  const handleRemoveAssignment = () => {
    if (removeAssignment) {
      setAssignments(prev => prev.filter(a => a.childId !== removeAssignment))
      toast.success('Aplikacija uklonjena')
      setRemoveAssignment(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('applications.details')}>
        <Button variant="outline" asChild>
          <Link href="/dashboard/applications">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Link>
        </Button>
      </PageHeader>

      {/* App Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div 
              className="flex h-20 w-20 items-center justify-center rounded-2xl shrink-0 mx-auto sm:mx-0"
              style={{ backgroundColor: app.color + '20', color: app.color }}
            >
              <Icon className="h-10 w-10" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold">{app.name}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <Badge>{t(`applications.categories.${app.category}`)}</Badge>
                <Badge variant="outline">
                  <Calendar className="mr-1 h-3 w-3" />
                  {app.minAge}-{app.maxAge} {t('children.years')}
                </Badge>
                {app.isActive ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {t('common.active')}
                  </Badge>
                ) : (
                  <Badge variant="secondary">{t('common.inactive')}</Badge>
                )}
              </div>
              <p className="mt-4 text-muted-foreground">{app.description}</p>
            </div>
            <div className="flex flex-col gap-2 items-center sm:items-end">
              <div className="text-center sm:text-right">
                <p className="text-3xl font-bold">{assignedChildren.length}</p>
                <p className="text-sm text-muted-foreground">{t('applications.assigned')}</p>
              </div>
              <Button onClick={() => setIsAssignDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('children.assignApps')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('applications.features')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {app.features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                {feature}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Contract */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PlugZap className="h-5 w-5" />
            Integracijski ugovor
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Platforma</p>
            <p className="mt-1 font-medium capitalize">{app.platform}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Autentifikacija</p>
            <p className="mt-1 font-medium">{app.authMethod}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">API verzija</p>
            <p className="mt-1 font-medium">{app.apiVersion}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Sinhronizacija</p>
            <p className="mt-1 font-medium">{app.syncFrequency}</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="mb-2 text-sm text-muted-foreground">Podaci koje aplikacija razmjenjuje</p>
            <div className="flex flex-wrap gap-2">
              {(app.dataContract ?? []).map(contract => (
                <Badge key={contract} variant="outline">{contract}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Children */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('applications.assigned')} ({assignedChildren.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedChildren.length > 0 ? (
            <div className="space-y-4">
              {assignedChildren.map(({ child, progress, ...assignment }) => (
                <div 
                  key={assignment.id}
                  className="flex items-center gap-4 p-4 rounded-lg border"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {child!.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/dashboard/children/${child!.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {child!.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(assignment.totalUsageTime)} ukupno
                      </span>
                      {assignment.dailyTimeLimit > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {assignment.dailyTimeLimit} min/dan
                        </Badge>
                      )}
                    </div>
                  </div>
                  {progress && (
                    <div className="hidden sm:block w-32">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Level {progress.level}</span>
                        <span>{progress.score}%</span>
                      </div>
                      <Progress value={progress.score} className="h-1.5" />
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setRemoveAssignment(child!.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nema dodijeljene djece</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAssignDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('children.assignApps')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <AssignAppDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        app={app}
        onAssign={handleAssign}
        assignedChildIds={assignedChildren.map(a => a.child!.id)}
      />

      {/* Remove Confirmation */}
      <ConfirmationDialog
        open={!!removeAssignment}
        onOpenChange={(open) => !open && setRemoveAssignment(null)}
        title={t('children.removeApp')}
        description="Da li ste sigurni da želite ukloniti ovu aplikaciju od djeteta?"
        confirmLabel={t('common.delete')}
        variant="destructive"
        onConfirm={handleRemoveAssignment}
      />
    </div>
  )
}
