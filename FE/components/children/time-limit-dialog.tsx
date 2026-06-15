'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiGetRestriction, apiSetRestriction } from '@/lib/api'
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

/**
 * Lets a parent set (or clear) the daily time limit for a single app
 * assigned to a child, and optionally block the app temporarily.
 */
export function TimeLimitDialog({ open, onOpenChange, childId, appId, appName, onSaved }: TimeLimitDialogProps) {
  const [value, setValue] = useState('')
  const [isBlocked, setIsBlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)
    apiGetRestriction(childId, appId)
      .then(r => {
        if (!active) return
        setValue(r.dailyTimeLimitMinutes != null ? String(r.dailyTimeLimitMinutes) : '')
        setIsBlocked(r.isBlocked)
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [open, childId, appId])

  const handleSave = async () => {
    const trimmed = value.trim()
    const minutes = trimmed === '' ? null : Number(trimmed)
    if (minutes !== null && (Number.isNaN(minutes) || minutes < 0)) {
      toast.error('Unesite ispravan broj minuta')
      return
    }
    setSaving(true)
    try {
      await apiSetRestriction(childId, appId, { dailyTimeLimitMinutes: minutes, isBlocked })
      toast.success('Vremensko ograničenje sačuvano')
      onOpenChange(false)
      await onSaved?.()
    } catch {
      toast.error('Greška pri čuvanju ograničenja')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Vremensko ograničenje — {appName}</DialogTitle>
          <DialogDescription>
            Postavite dnevno ograničenje korištenja (u minutama) ili ostavite prazno za bez ograničenja.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="dailyLimit">Dnevni limit (minuta)</Label>
              <Input
                id="dailyLimit"
                type="number"
                min={0}
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="Bez ograničenja"
                disabled={saving}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isBlocked}
                onChange={e => setIsBlocked(e.target.checked)}
                disabled={saving}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Privremeno blokiraj aplikaciju
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Odustani
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sačuvaj
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
