'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Smartphone, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslation } from '@/components/providers'
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
 * Per-application preference override editor. Starts from the app's resolved
 * (effective) settings and exposes a single switch to follow the child's
 * global preferences or maintain its own override.
 */
export function AppPreferencePanel({
  childId,
  app,
  globalPrefs,
  override,
  onOverrideChange,
  compactPreview = true,
}: AppPreferencePanelProps) {
  const { t } = useTranslation()
  const hasOverride = Object.keys(override).length > 0
  const [useGlobal, setUseGlobal] = useState(!hasOverride)
  const [prefs, setPrefs] = useState<UIPreferences>(() => resolvePrefs(globalPrefs, override))
  const [saving, setSaving] = useState(false)
  // The app's platform decides which device chrome the preview shows. 'hybrid'
  // apps run on both, so they get a tab switcher; mobile/web apps just show
  // the one device they actually run on.
  const [previewPlatform, setPreviewPlatform] = useState<'mobile' | 'web'>(
    app.platform === 'web' ? 'web' : 'mobile'
  )

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
        toast.success(t('appPreferences.usesGlobalNowToast', { name: app.name }))
      } else {
        const record = prefsToRecord(prefs)
        await apiSetAppPreferences(childId, app.id, record)
        onOverrideChange(record)
        toast.success(t('appPreferences.customSavedToast', { name: app.name }))
      }
    } catch {
      toast.error(t('appPreferences.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const previewPrefs = useGlobal ? globalPrefs : prefs

  const preview = (platform: 'mobile' | 'web') => (
    <PreferencePreview preferences={previewPrefs} compact={compactPreview} platform={platform} />
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="pr-4">
          <Label className="text-sm font-medium">{t('appPreferences.useGlobalLabel')}</Label>
          <p className="text-xs text-muted-foreground">
            {t('appPreferences.useGlobalDesc', { name: app.name })}
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
            {useGlobal ? t('appPreferences.previewGlobal') : t('appPreferences.previewCustom')}
          </p>
          {app.platform === 'hybrid' ? (
            <Tabs value={previewPlatform} onValueChange={(v) => setPreviewPlatform(v as 'mobile' | 'web')}>
              <TabsList className="mb-3 grid w-full grid-cols-2">
                <TabsTrigger value="mobile">
                  <Smartphone className="mr-1.5 h-3.5 w-3.5" />
                  {t('settings.previewMobile')}
                </TabsTrigger>
                <TabsTrigger value="web">
                  <Globe className="mr-1.5 h-3.5 w-3.5" />
                  {t('settings.previewWeb')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="mobile">{preview('mobile')}</TabsContent>
              <TabsContent value="web">{preview('web')}</TabsContent>
            </Tabs>
          ) : (
            preview(app.platform === 'web' ? 'web' : 'mobile')
          )}
        </div>
      </div>

      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        {useGlobal ? t('appPreferences.saveGlobal') : t('appPreferences.saveFor', { name: app.name })}
      </Button>
    </div>
  )
}
