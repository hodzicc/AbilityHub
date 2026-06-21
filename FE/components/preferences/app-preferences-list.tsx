'use client'

import { useEffect, useState } from 'react'
import { AppWindow, Settings2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { apiGetAppPreferences } from '@/lib/api'
import { resolvePrefs } from '@/lib/preferences'
import { useTranslation } from '@/components/providers'
import { AppPreferencePanel } from './app-preference-panel'
import type { Application, UIPreferences } from '@/lib/types'

interface AppPreferencesListProps {
  childId: string
  apps: Application[]
  globalPrefs: UIPreferences
}

/**
 * Per-application preference overview & editor for a child. Shows a summary
 * table of which apps inherit global preferences vs. have customizations,
 * followed by an accordion where each app expands into an `AppPreferencePanel`.
 */
export function AppPreferencesList({ childId, apps, globalPrefs }: AppPreferencesListProps) {
  const { t } = useTranslation()

  const SUMMARY_COLUMNS: { key: keyof UIPreferences; label: string }[] = [
    { key: 'fontSize', label: t('appPreferences.columnFont') },
    { key: 'colorScheme', label: t('appPreferences.columnColor') },
    { key: 'highContrast', label: t('appPreferences.columnContrast') },
    { key: 'reducedMotion', label: t('appPreferences.columnAnimation') },
    { key: 'soundEnabled', label: t('appPreferences.columnSound') },
  ]

  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>({})
  const [loading, setLoading] = useState(true)

  function translatedLabelFor(key: keyof UIPreferences, prefs: UIPreferences): string {
    switch (key) {
      case 'fontSize':
        return t(`settings.fontSizes.${prefs.fontSize === 'extra-large' ? 'extraLarge' : prefs.fontSize}`)
      case 'colorScheme':
        return t(`settings.colorSchemes.${prefs.colorScheme === 'high-contrast' ? 'highContrast' : prefs.colorScheme}`)
      case 'reducedMotion':
        return prefs.reducedMotion ? t('common.enabled') : t('common.disabled')
      case 'highContrast':
        return prefs.highContrast ? t('common.enabled') : t('common.disabled')
      case 'soundEnabled':
        return prefs.soundEnabled ? t('common.enabled') : t('common.disabled')
      default:
        return ''
    }
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all(
      apps.map(app =>
        apiGetAppPreferences(childId, app.id)
          .then(r => [app.id, r] as const)
          .catch(() => [app.id, {}] as const)
      )
    ).then(entries => {
      if (active) setOverrides(Object.fromEntries(entries))
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, apps.map(a => a.id).join(',')])

  if (apps.length === 0) return null

  if (loading) {
    return <div className="h-32 animate-pulse rounded-lg bg-muted" />
  }

  return (
    <div className="space-y-4">
      {/* At-a-glance summary */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">{t('appPreferences.columnApp')}</th>
              {SUMMARY_COLUMNS.map(col => (
                <th key={col.key} className="px-3 py-2 font-medium">{col.label}</th>
              ))}
              <th className="px-3 py-2 font-medium">{t('appPreferences.columnStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {apps.map(app => {
              const override = overrides[app.id] ?? {}
              const resolved = resolvePrefs(globalPrefs, override)
              const hasOverride = Object.keys(override).length > 0
              return (
                <tr key={app.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 font-medium">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-md shrink-0"
                        style={{ backgroundColor: app.color + '22', color: app.color }}
                      >
                        <AppWindow className="h-3.5 w-3.5" />
                      </div>
                      {app.name}
                    </div>
                  </td>
                  {SUMMARY_COLUMNS.map(col => (
                    <td key={col.key} className="px-3 py-2 text-muted-foreground">
                      {translatedLabelFor(col.key, resolved)}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    {hasOverride ? (
                      <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-0">
                        {t('appPreferences.customized')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="border-0">{t('appPreferences.global')}</Badge>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Per-app editors */}
      <Accordion type="multiple" className="rounded-lg border px-3">
        {apps.map(app => {
          const override = overrides[app.id] ?? {}
          const hasOverride = Object.keys(override).length > 0
          return (
            <AccordionItem key={app.id} value={app.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                    style={{ backgroundColor: app.color + '22', color: app.color }}
                  >
                    <AppWindow className="h-4 w-4" />
                  </div>
                  <span>{app.name}</span>
                  {hasOverride ? (
                    <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-0">
                      {t('appPreferences.customized')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="border-0">
                      <Settings2 className="mr-1 h-3 w-3" />
                      {t('appPreferences.usesGlobal')}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <AppPreferencePanel
                  childId={childId}
                  app={app}
                  globalPrefs={globalPrefs}
                  override={override}
                  onOverrideChange={next => setOverrides(prev => ({ ...prev, [app.id]: next }))}
                />
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
