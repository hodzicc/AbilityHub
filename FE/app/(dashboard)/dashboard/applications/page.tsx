'use client'

import { useState, useEffect } from 'react'
import { useAuth, useTranslation } from '@/components/providers'
import { PageHeader, EmptyState, ConfirmationDialog } from '@/components/shared'
import { AppCard, AppFormDialog } from '@/components/applications'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Application, AppCategory } from '@/lib/types'
import { Search, AppWindow, Plus } from 'lucide-react'
import { apiGetApps, apiGetChildren, apiGetChildApps, apiUpdateApp, apiDeactivateApp, type ApplicationResponse } from '@/lib/api'
import { APP_CATEGORIES } from '@/lib/constants'
import { toast } from 'sonner'

const categories: (AppCategory | 'all')[] = ['all', ...APP_CATEGORIES.map(c => c.value)]

function responseToApp(r: ApplicationResponse): Application {
  let features: string[] = []
  try { features = JSON.parse(r.featuresJson) } catch {}
  return {
    id: r.id, key: r.key, name: r.name, description: r.description,
    category: (r.category as AppCategory) || 'education',
    icon: r.iconName || 'AppWindow', color: r.color || '#4F46E5',
    minAge: r.minAge, maxAge: r.maxAge, features,
    isActive: r.isActive,
    platform: (r.platform?.toLowerCase() as 'web' | 'mobile' | 'hybrid') || 'mobile',
    dataFormat: r.dataFormat, version: r.version,
  }
}

export default function ApplicationsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [apps, setApps] = useState<Application[]>([])
  const [rawApps, setRawApps] = useState<ApplicationResponse[]>([])
  const [assignedCounts, setAssignedCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'all'>('all')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editApp, setEditApp] = useState<ApplicationResponse | null>(null)
  const [deactivateApp, setDeactivateApp] = useState<ApplicationResponse | null>(null)

  const isAdmin = user?.role === 'admin'

  const loadApps = async () => {
    setIsLoading(true)
    try {
      const [appsData, children] = await Promise.all([
        apiGetApps(isAdmin),
        user && !isAdmin ? apiGetChildren(user.id).catch(() => []) : Promise.resolve([]),
      ])
      setRawApps(appsData)
      setApps(appsData.map(responseToApp))

      if (children.length > 0) {
        const counts: Record<string, number> = {}
        await Promise.all(
          children.map(async child => {
            const childApps = await apiGetChildApps(child.id).catch(() => [])
            childApps.forEach(ca => { counts[ca.applicationId] = (counts[ca.applicationId] ?? 0) + 1 })
          })
        )
        setAssignedCounts(counts)
      }
    } catch {
      toast.error(t('applications.loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadApps() }, [user?.id])

  const handleToggleActive = async (app: ApplicationResponse) => {
    if (app.isActive) {
      setDeactivateApp(app)
      return
    }
    try {
      await apiUpdateApp(app.id, { ...app, isActive: true })
      toast.success(t('applications.activatedToast', { name: app.name }))
      await loadApps()
    } catch {
      toast.error(t('applications.activateError'))
    }
  }

  const handleConfirmDeactivate = async () => {
    if (!deactivateApp) return
    try {
      await apiDeactivateApp(deactivateApp.id)
      toast.success(t('applications.deactivatedToast', { name: deactivateApp.name }))
      setDeactivateApp(null)
      await loadApps()
    } catch {
      toast.error(t('applications.deactivateError'))
      setDeactivateApp(null)
    }
  }

  const filteredApps = apps.filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t('applications.title')} description={t('applications.subtitle')}>
        {isAdmin && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('applications.addApp')}
          </Button>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`${t('common.search')}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              className={selectedCategory === category
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-sm'
                : 'hover:border-primary/60'}
              onClick={() => setSelectedCategory(category as AppCategory | 'all')}
            >
              {category === 'all' ? t('common.all') : t(`applications.categories.${category}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Apps Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredApps.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredApps.map(app => (
            <AppCard
              key={app.id}
              app={app}
              assignedCount={assignedCounts[app.id] ?? 0}
              isAdmin={isAdmin}
              onEdit={isAdmin ? () => {
                const raw = rawApps.find(r => r.id === app.id)
                if (raw) setEditApp(raw)
              } : undefined}
              onToggleActive={isAdmin ? () => {
                const raw = rawApps.find(r => r.id === app.id)
                if (raw) handleToggleActive(raw)
              } : undefined}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={AppWindow}
          title={searchQuery ? t('common.noSearchResults') : t('applications.noApps')}
          description={searchQuery ? t('common.tryDifferentTerm') : t('applications.noAppsDesc')}
          action={isAdmin && !searchQuery ? { label: t('applications.addApp'), onClick: () => setIsAddOpen(true) } : undefined}
        />
      )}

      {/* Add Application Dialog (admin only) */}
      <AppFormDialog open={isAddOpen} onOpenChange={setIsAddOpen} onSaved={loadApps} />

      {/* Edit Application Dialog (admin only) */}
      {editApp && (
        <AppFormDialog
          open={!!editApp}
          onOpenChange={(open) => !open && setEditApp(null)}
          app={editApp}
          onSaved={loadApps}
        />
      )}

      {/* Deactivate confirmation (admin only) */}
      <ConfirmationDialog
        open={!!deactivateApp}
        onOpenChange={(open) => !open && setDeactivateApp(null)}
        title={t('applications.deactivateTitle')}
        description={t('applications.deactivateConfirm', { name: deactivateApp?.name ?? '' })}
        confirmLabel={t('applications.deactivateAction')}
        variant="destructive"
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  )
}
