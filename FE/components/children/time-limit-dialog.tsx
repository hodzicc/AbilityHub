'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from '@/components/providers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { apiGetRestriction, apiSetRestriction, apiGetLimitStatus, type LimitStatusResponse } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface TimeLimitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  childId: string
  appId: string
  appName: string
  onSaved?: () => Promise<void> | void
}

const MIN_LIMIT = 5
const MAX_LIMIT = 120
const DEFAULT_LIMIT = 30

/**
 * Lets a parent set (or clear) the daily time limit for a single app
 * assigned to a child, and optionally block the app temporarily. Uses the
 * same switch + slider control as the assign-app dialog so the daily-limit
 * UI is consistent everywhere it appears.
 */
export function TimeLimitDialog({ open, onOpenChange, childId, appId, appName, onSaved }: TimeLimitDialogProps) {
  const { t } = useTranslation()
  const [hasTimeLimit, setHasTimeLimit] = useState(false)
  const [timeLimit, setTimeLimit] = useState(DEFAULT_LIMIT)
  const [isBlocked, setIsBlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [limitStatus, setLimitStatus] = useState<LimitStatusResponse | null>(null)

  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)
    Promise.all([
      apiGetRestriction(childId, appId),
      apiGetLimitStatus(childId, appId).catch(() => null),
    ])
      .then(([r, status]) => {
        if (!active) return
        setHasTimeLimit(r.dailyTimeLimitMinutes != null)
        setTimeLimit(r.dailyTimeLimitMinutes ?? DEFAULT_LIMIT)
        setIsBlocked(r.isBlocked)
        setLimitStatus(status)
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [open, childId, appId])

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiSetRestriction(childId, appId, {
        dailyTimeLimitMinutes: hasTimeLimit ? timeLimit : null,
        isBlocked,
      })
      toast.success(t('timeLimit.saved'))
      onOpenChange(false)
      await onSaved?.()
    } catch {
      toast.error(t('timeLimit.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('timeLimit.title', { name: appName })}</DialogTitle>
          <DialogDescription>
            {t('timeLimit.description')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        ) : (
          <div className="space-y-4 py-2">
            {limitStatus && (
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{t('timeLimit.usedToday')}: </span>
                <span className="font-medium">
                  {limitStatus.usedTodayMinutes} {limitStatus.dailyLimitMinutes != null ? `/ ${limitStatus.dailyLimitMinutes}` : ''} {t('common.minutesShort')}
                </span>
                {limitStatus.limitReached && (
                  <span className="ml-2 font-medium text-destructive">{t('timeLimit.limitReached')}</span>
                )}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('applications.timeLimit')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('applications.limitSwitchDesc')}
                </p>
              </div>
              <Switch
                checked={hasTimeLimit}
                onCheckedChange={setHasTimeLimit}
                disabled={saving}
              />
            </div>

            {hasTimeLimit && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{t('timeLimit.dailyLimitMinutes')}</Label>
                  <span className="text-sm font-medium">{timeLimit} {t('common.minutesShort')}</span>
                </div>
                <Slider
                  value={[timeLimit]}
                  onValueChange={([value]) => setTimeLimit(value)}
                  min={MIN_LIMIT}
                  max={MAX_LIMIT}
                  step={5}
                  disabled={saving}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{MIN_LIMIT} {t('common.minutesShort')}</span>
                  <span>{MAX_LIMIT} {t('common.minutesShort')}</span>
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isBlocked}
                onChange={e => setIsBlocked(e.target.checked)}
                disabled={saving}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              {t('timeLimit.blockTemporarily')}
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
