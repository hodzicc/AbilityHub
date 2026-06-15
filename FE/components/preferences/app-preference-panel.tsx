'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { PreferenceFields } from './preference-fields'
import { PreferencePreview } from './preference-preview'
import { prefsToRecord, resolvePrefs } from '@/lib/preferences'
import { apiClearAppPreferences, apiSetAppPreferences } from '@/lib/api'
import type { Application, UIPreferences } from '@/lib/types'

interface AppPreferencePanelProps {
  childId: string
  app: Application
  /** The child's global (default) preferences — used as the baseline when "use global" is on. */
  globalPrefs: UIPreferences
  /** Raw per-app override record as currently stored (empty = no override). */
  override: Record<string, string>
  /** Called after a successful save/clear with the new raw override record. */
  onOverrideChange: (override: Record<string, string>) => void
  compactPreview?: boolean
}

/**
 * Per-application preference override editor.
 *
 * Replaces the old approach of duplicating the entire global preferences form
 * per app. Instead:
 *  - Starts from the app's *resolved* (effective) settings — global defaults
 *    merged with any existing override — not hardcoded defaults.
 *  - A single "use global settings" switch makes the inheritance explicit:
 *    off = this app currently has its own overrides, on = it follows the
 *    child's global preferences.
 *  - A live preview shows the effect of the current selection immediately.
 */
export function AppPreferencePanel({
  childId,
  app,
  globalPrefs,
  override,
  onOverrideChange,
  compactPreview = true,
}: AppPreferencePanelProps) {
  const hasOverride = Object.keys(override).length > 0
  const [useGlobal, setUseGlobal] = useState(!hasOverride)
  const [prefs, setPrefs] = useState<UIPreferences>(() => resolvePrefs(globalPrefs, override))
  const [saving, setSaving] = useState(false)

  const handleToggleGlobal = (checked: boolean) => {
    setUseGlobal(checked)
    if (checked) {
      // Reset the working copy back to the global defaults for the preview.
      setPrefs(globalPrefs)
    } else if (!hasOverride) {
      // Switching to "custom" for the first time — start from the effective
      // (resolved) values the app currently uses, not generic defaults.
      setPrefs(resolvePrefs(globalPrefs, override))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (useGlobal) {
        await apiClearAppPreferences(childId, app.id)
        onOverrideChange({})
        toast.success(`"${app.name}" sada koristi globalne postavke`)
      } else {
        const record = prefsToRecord(prefs)
        await apiSetAppPreferences(childId, app.id, record)
        onOverrideChange(record)
        toast.success(`Prilagođene postavke za "${app.name}" sačuvane`)
      }
    } catch {
      toast.error('Greška pri čuvanju postavki')
    } finally {
      setSaving(false)
    }
  }

  const previewPrefs = useGlobal ? globalPrefs : prefs

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="pr-4">
          <Label className="text-sm font-medium">Koristi globalne postavke</Label>
          <p className="text-xs text-muted-foreground">
            Kada je uključeno, &quot;{app.name}&quot; prati opće preferencije djeteta. Isključite da
            postavite font, boje i pristupačnost samo za ovu aplikaciju.
          </p>
        </div>
        <Switch checked={useGlobal} onCheckedChange={handleToggleGlobal} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {!useGlobal && (
          <PreferenceFields value={prefs} onChange={setPrefs} idPrefix={`app-${app.id}`} />
        )}
        <div className={!useGlobal ? '' : 'lg:col-span-2'}>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {useGlobal ? 'Pregled — globalne postavke' : 'Pregled — postavke za ovu aplikaciju'}
          </p>
          <PreferencePreview preferences={previewPrefs} compact={compactPreview} />
        </div>
      </div>

      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        {useGlobal ? 'Sačuvaj (koristi globalne)' : `Sačuvaj za ${app.name}`}
      </Button>
    </div>
  )
}
