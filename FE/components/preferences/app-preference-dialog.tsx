'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AppPreferencePanel } from './app-preference-panel'
import { apiGetAppPreferences, apiGetPreferences } from '@/lib/api'
import { DEFAULT_PREFERENCES, recordToPrefs } from '@/lib/preferences'
import type { Application, UIPreferences } from '@/lib/types'

interface AppPreferenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  childId: string
  childName: string
  app: Application
}

/**
 * One-click "Postavke" entry point for a single child + app combination.
 *
 * Used from the Application detail page so a parent can jump straight into
 * that app's preferences for a given child, without first navigating to the
 * child's profile.
 */
export function AppPreferenceDialog({ open, onOpenChange, childId, childName, app }: AppPreferenceDialogProps) {
  const [globalPrefs, setGlobalPrefs] = useState<UIPreferences>(DEFAULT_PREFERENCES)
  const [override, setOverride] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)
    Promise.all([
      apiGetPreferences(childId).catch(() => ({} as Record<string, string>)),
      apiGetAppPreferences(childId, app.id).catch(() => ({} as Record<string, string>)),
    ]).then(([rawGlobal, rawOverride]) => {
      if (!active) return
      setGlobalPrefs(recordToPrefs(rawGlobal))
      setOverride(rawOverride)
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [open, childId, app.id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Postavke — {app.name}</DialogTitle>
          <DialogDescription>
            Prilagodite prikaz aplikacije &quot;{app.name}&quot; za {childName}, ili ostavite globalne
            postavke djeteta.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        ) : (
          <AppPreferencePanel
            childId={childId}
            app={app}
            globalPrefs={globalPrefs}
            override={override}
            onOverrideChange={setOverride}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
