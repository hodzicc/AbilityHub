'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { useTranslation } from '@/components/providers'
import { apiGetApps, apiAssignApp, apiSetRestriction, type ApplicationResponse } from '@/lib/api'
import { getAppIcon } from '@/lib/app-icons'
import type { Application } from '@/lib/types'
import { Check, Plus, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

function responseToApp(r: ApplicationResponse): Application {
  let features: string[] = []
  try { features = JSON.parse(r.featuresJson) } catch {}
  return {
    id: r.id, key: r.key, name: r.name, description: r.description,
    category: (r.category as Application['category']) || 'education',
    icon: r.iconName || 'AppWindow', color: r.color || '#4F46E5',
    minAge: r.minAge, maxAge: r.maxAge, features, isActive: r.isActive,
  }
}

interface AssignAppsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  childId: string
  childName: string
  assignedAppIds: string[]
  onAssigned: () => Promise<void> | void
}

const MIN_LIMIT = 5
const MAX_LIMIT = 120
const DEFAULT_LIMIT = 30

/**
 * Bulk "Dodaj aplikacije" entry point from a child's profile page.
 *
 * Lists all active applications, lets the parent toggle "Dodaj" on as many
 * apps as they like, then assigns all of them at once on "Sačuvaj" — avoiding
 * the per-app navigate → Dodaj → pick child flow.
 */
export function AssignAppsDialog({
  open, onOpenChange, childId, childName, assignedAppIds, onAssigned,
}: AssignAppsDialogProps) {
  const { t } = useTranslation()
  const [apps, setApps] = useState<Application[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [limitEnabled, setLimitEnabled] = useState<Set<string>>(new Set())
  const [timeLimits, setTimeLimits] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)
    setSelected(new Set())
    setLimitEnabled(new Set())
    setTimeLimits({})
    setSearch('')
    apiGetApps()
      .then(res => {
        if (!active) return
        setApps(res.filter(a => a.isActive).map(responseToApp))
      })
      .catch(() => toast.error(t('applications.loadError')))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [open])

  const assignedSet = useMemo(() => new Set(assignedAppIds), [assignedAppIds])

  const availableApps = useMemo(
    () => apps.filter(a => !assignedSet.has(a.id)),
    [apps, assignedSet]
  )

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return availableApps
    return availableApps.filter(a =>
      a.name.toLowerCase().includes(q) ||
      t(`applications.categories.${a.category}`).toLowerCase().includes(q)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableApps, search])

  const toggle = (appId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(appId)) next.delete(appId)
      else next.add(appId)
      return next
    })
  }

  const handleSave = async () => {
    if (selected.size === 0) {
      onOpenChange(false)
      return
    }
    setSaving(true)
    try {
      const ids = Array.from(selected)
      const results = await Promise.allSettled(ids.map(appId => apiAssignApp(childId, appId)))
      const succeededIds = ids.filter((_, i) => results[i].status === 'fulfilled')
      const failed = results.length - succeededIds.length

      if (succeededIds.length > 0) {
        toast.success(
          succeededIds.length === 1
            ? t('applications.assignedOneSuccess')
            : t('applications.assignedManySuccess', { count: succeededIds.length })
        )
      }
      if (failed > 0) {
        // Surface the backend's reason when there is one (e.g. age out of range)
        // instead of only a generic failure count.
        const firstRejection = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined
        let reason = ''
        try {
          const body = (firstRejection?.reason as { message?: string })?.message
          if (body) reason = (JSON.parse(body) as { message?: string }).message ?? ''
        } catch {}
        toast.error(
          reason ||
            (failed === 1
              ? t('applications.assignOneError')
              : t('applications.assignManyError', { count: failed }))
        )
      }

      // Apply any daily time limits set for the successfully assigned apps
      const limitTargets = succeededIds.filter(appId => limitEnabled.has(appId))
      if (limitTargets.length > 0) {
        await Promise.allSettled(
          limitTargets.map(appId =>
            apiSetRestriction(childId, appId, {
              dailyTimeLimitMinutes: timeLimits[appId] ?? DEFAULT_LIMIT,
              isBlocked: false,
            })
          )
        )
      }

      await onAssigned()
      if (failed === 0) onOpenChange(false)
      setSelected(new Set())
      setLimitEnabled(new Set())
      setTimeLimits({})
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('applications.bulkAssignTitle', { name: childName })}</DialogTitle>
          <DialogDescription>
            {t('applications.bulkAssignDesc', { saveLabel: t('common.save') })}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : apps.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('applications.noAppsAvailableShort')}
          </p>
        ) : availableApps.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('applications.allAssigned')}
          </p>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('common.search')}
                className="pl-9"
              />
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {filteredApps.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t('applications.noResultsFor', { query: search })}
                </p>
              ) : (
                filteredApps.map(app => {
                  const Icon = getAppIcon(app.icon)
                  const isSelected = selected.has(app.id)
                  return (
                    <div
                      key={app.id}
                      className={`rounded-lg border p-3 transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: app.color + '22', color: app.color }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{app.name}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {t(`applications.categories.${app.category}`)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {app.minAge}-{app.maxAge} {t('children.years')}
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={() => toggle(app.id)}
                          className="shrink-0"
                        >
                          {isSelected ? (
                            <>
                              <Check className="mr-1.5 h-4 w-4" />
                              {t('applications.selected')}
                            </>
                          ) : (
                            <>
                              <Plus className="mr-1.5 h-4 w-4" />
                              {t('common.add')}
                            </>
                          )}
                        </Button>
                      </div>
                      {isSelected && (
                        <div className="mt-2 space-y-2 pl-[52px]">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`limit-switch-${app.id}`} className="text-xs text-muted-foreground">
                              {t('applications.limitSwitchDesc')}
                            </Label>
                            <Switch
                              id={`limit-switch-${app.id}`}
                              checked={limitEnabled.has(app.id)}
                              onCheckedChange={checked => setLimitEnabled(prev => {
                                const next = new Set(prev)
                                if (checked) next.add(app.id)
                                else next.delete(app.id)
                                return next
                              })}
                            />
                          </div>
                          {limitEnabled.has(app.id) && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{t('applications.dailyLimitMinShort')}</span>
                                <span className="text-xs font-medium">{timeLimits[app.id] ?? DEFAULT_LIMIT} min</span>
                              </div>
                              <Slider
                                value={[timeLimits[app.id] ?? DEFAULT_LIMIT]}
                                onValueChange={([value]) => setTimeLimits(prev => ({ ...prev, [app.id]: value }))}
                                min={MIN_LIMIT}
                                max={MAX_LIMIT}
                                step={5}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving || availableApps.length === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selected.size > 0 ? t('applications.saveCount', { count: selected.size }) : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
