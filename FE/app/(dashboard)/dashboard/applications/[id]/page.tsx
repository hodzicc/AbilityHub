'use client'

import { use, useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useAuth, useTranslation } from '@/components/providers'
import { PageHeader, ConfirmationDialog } from '@/components/shared'
import { AssignAppDialog, AppFormDialog } from '@/components/applications'
import { AppPreferenceDialog } from '@/components/preferences'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import type { Application, Child } from '@/lib/types'
import {
  ArrowLeft,
  Plus,
  Clock,
  Users,
  Calendar,
  Trash2,
  PlugZap,
  PowerOff,
  Power,
  Settings2,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  apiGetApp,
  apiGetChildren,
  apiGetAllUsers,
  apiGetChildApps,
  apiAssignApp,
  apiRemoveApp,
  apiGetRestriction,
  apiDeactivateApp,
  apiUpdateApp,
  type ApplicationResponse,
  type UserProfileResponse,
} from '@/lib/api'
import { ROLE_ID } from '@/lib/constants'
import { getAppIcon } from '@/lib/app-icons'

function responseToApp(r: ApplicationResponse): Application {
  let features: string[] = []
  try { features = JSON.parse(r.featuresJson) } catch {}
  return {
    id: r.id,
    key: r.key,
    name: r.name,
    description: r.description,
    category: (r.category as Application['category']) || 'education',
    icon: r.iconName || 'AppWindow',
    color: r.color || '#4F46E5',
    minAge: r.minAge,
    maxAge: r.maxAge,
    features,
    isActive: r.isActive,
    platform: (r.platform?.toLowerCase() as 'web' | 'mobile' | 'hybrid') || 'mobile',
    dataFormat: r.dataFormat,
    version: r.version,
  }
}

interface AssignedChild {
  child: Child
  dailyTimeLimit: number
  totalUsageTime: number
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [app, setApp] = useState<Application | null>(null)
  const [rawApp, setRawApp] = useState<ApplicationResponse | null>(null)
  const [assignedChildren, setAssignedChildren] = useState<AssignedChild[]>([])
  const [availableChildren, setAvailableChildren] = useState<Child[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFoundFlag, setNotFoundFlag] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [removeChildId, setRemoveChildId] = useState<string | null>(null)
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)
  const [prefsChild, setPrefsChild] = useState<Child | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const loadData = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const [appData, children] = await Promise.all([
        apiGetApp(id),
        isAdmin
          ? apiGetAllUsers(1, 200).then(r => r.items.filter(u => u.roleId === ROLE_ID.CHILD)).catch(() => [] as UserProfileResponse[])
          : apiGetChildren(user.id).catch(() => [] as UserProfileResponse[]),
      ])

      setApp(responseToApp(appData))
      setRawApp(appData)

      const assigned: AssignedChild[] = []
      const available: Child[] = []

      await Promise.all(
        children.map(async p => {
          const childApps = await apiGetChildApps(p.id).catch(() => [])
          const hasThis = childApps.some(ca => ca.applicationId === id)
          const child: Child = {
            id: p.id,
            name: `${p.firstName} ${p.lastName}`.trim(),
            firstName: p.firstName,
            lastName: p.lastName,
            dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : new Date('2015-01-01'),
            gender: (p.gender as 'male' | 'female') ?? 'male',
            parentId: user.id,
            assignedApps: childApps.map(a => a.applicationId),
            createdAt: new Date(p.createdAt),
          }
          if (hasThis) {
            const restriction = await apiGetRestriction(p.id, id).catch(() => ({
              dailyTimeLimitMinutes: null,
              isBlocked: false,
            }))
            assigned.push({
              child,
              dailyTimeLimit: restriction.dailyTimeLimitMinutes ?? 0,
              totalUsageTime: 0, // not tracked in AppRegistry — would need Usage service
            })
          } else {
            available.push(child)
          }
        })
      )

      setAssignedChildren(assigned)
      setAvailableChildren(available)
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('404')) setNotFoundFlag(true)
      else toast.error(t('applications.loadOneError'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id])

  const handleAssign = async (childId: string, timeLimit: number) => {
    try {
      await apiAssignApp(childId, id)
      if (timeLimit > 0) {
        const { apiSetRestriction } = await import('@/lib/api')
        await apiSetRestriction(childId, id, {
          dailyTimeLimitMinutes: timeLimit,
          isBlocked: false,
        })
      }
      toast.success(t('applications.assignSuccess'))
      await loadData()
    } catch {
      toast.error(t('applications.assignError'))
    }
  }

  const handleRemove = async () => {
    if (!removeChildId) return
    try {
      await apiRemoveApp(removeChildId, id)
      toast.success(t('applications.removedToast'))
      setRemoveChildId(null)
      await loadData()
    } catch {
      toast.error(t('applications.removeError'))
      setRemoveChildId(null)
    }
  }

  const handleDeactivate = async () => {
    try {
      await apiDeactivateApp(id)
      toast.success(t('applications.deactivatedGenericToast'))
      setIsDeactivateDialogOpen(false)
      await loadData()
    } catch {
      toast.error(t('applications.deactivateError'))
      setIsDeactivateDialogOpen(false)
    }
  }

  const handleActivate = async () => {
    if (!rawApp) return
    try {
      await apiUpdateApp(id, { ...rawApp, isActive: true })
      toast.success(t('applications.activatedGenericToast'))
      await loadData()
    } catch {
      toast.error(t('applications.activateError'))
    }
  }

  if (notFoundFlag) notFound()

  if (isLoading || !app) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  const Icon = getAppIcon(app.icon)

  return (
    <div className="space-y-6">
      <PageHeader title={t('applications.details')}>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
          )}
          {isAdmin && app.isActive && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setIsDeactivateDialogOpen(true)}
            >
              <PowerOff className="mr-2 h-4 w-4" />
              {t('applications.deactivate')}
            </Button>
          )}
          {isAdmin && !app.isActive && (
            <Button variant="outline" onClick={handleActivate}>
              <Power className="mr-2 h-4 w-4" />
              {t('applications.activate')}
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/dashboard/applications">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
        </div>
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
              {!isAdmin && (
                <Button onClick={() => setIsAssignDialogOpen(true)} disabled={availableChildren.length === 0}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('children.assignApps')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      {app.features.length > 0 && (
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
      )}

      {/* Integration Contract */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PlugZap className="h-5 w-5" />
            {t('applications.integrationContract')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{t('applications.platform')}</p>
            <p className="mt-1 font-medium capitalize">{app.platform}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{t('applications.version')}</p>
            <p className="mt-1 font-medium">{app.version || '—'}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{t('applications.dataFormat')}</p>
            <p className="mt-1 font-medium">{app.dataFormat || '—'}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{t('applications.key')}</p>
            <p className="mt-1 font-medium font-mono text-sm">{app.key}</p>
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
              {assignedChildren.map(({ child, dailyTimeLimit }) => (
                <div key={child.id} className="flex items-center gap-4 p-4 rounded-lg border">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {child.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/children/${child.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {child.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {dailyTimeLimit > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {dailyTimeLimit} {t('applications.minutesPerDayShort')}
                        </span>
                      )}
                    </div>
                  </div>
                  {!isAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        title={t('applications.settingsFor', { name: child.name })}
                        onClick={() => setPrefsChild(child)}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setRemoveChildId(child.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('applications.noAssignedChildren')}</p>
              {!isAdmin && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsAssignDialogOpen(true)}
                  disabled={availableChildren.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('children.assignApps')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      {!isAdmin && (
        <AssignAppDialog
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          app={app}
          onAssign={handleAssign}
          availableChildren={availableChildren}
        />
      )}

      {/* Remove child from app confirmation */}
      {!isAdmin && (
        <ConfirmationDialog
          open={!!removeChildId}
          onOpenChange={(open) => !open && setRemoveChildId(null)}
          title={t('children.removeApp')}
          description={t('applications.removeConfirm')}
          confirmLabel={t('common.delete')}
          variant="destructive"
          onConfirm={handleRemove}
        />
      )}

      {/* Deactivate app confirmation (admin) */}
      <ConfirmationDialog
        open={isDeactivateDialogOpen}
        onOpenChange={setIsDeactivateDialogOpen}
        title={t('applications.deactivateTitle')}
        description={t('applications.deactivateConfirm', { name: app?.name ?? '' })}
        confirmLabel={t('applications.deactivateAction')}
        variant="destructive"
        onConfirm={handleDeactivate}
      />

      {/* Edit app dialog (admin) */}
      {isAdmin && rawApp && (
        <AppFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          app={rawApp}
          onSaved={loadData}
        />
      )}

      {/* Per-child preferences for this app */}
      {!isAdmin && prefsChild && (
        <AppPreferenceDialog
          open={!!prefsChild}
          onOpenChange={(open) => !open && setPrefsChild(null)}
          childId={prefsChild.id}
          childName={prefsChild.name}
          app={app}
        />
      )}
    </div>
  )
}
