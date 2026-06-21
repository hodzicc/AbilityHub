'use client'

import { useState, useEffect } from 'react'
import { useAuth, useTranslation, usePreferences } from '@/components/providers'
import { PageHeader } from '@/components/shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FontSize, ColorScheme, FontFamily } from '@/lib/types'
import { FONT_SIZES as fontSizes, COLOR_SCHEMES as colorSchemes, FONT_FAMILIES as fontFamilies } from '@/lib/preferences'
import { toast } from 'sonner'
import { Smartphone, RefreshCw, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  apiGetChildren,
  apiGetPreferences,
  apiSetPreferences,
  type UserProfileResponse,
} from '@/lib/api'

export default function PreferencesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { preferences, updatePreferences, resetPreferences } = usePreferences()

  const [children, setChildren] = useState<UserProfileResponse[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingChild, setIsLoadingChild] = useState(false)

  // Load children list on mount
  useEffect(() => {
    if (!user) return
    apiGetChildren(user.id)
      .then(list => {
        setChildren(list)
        if (list.length > 0) setSelectedChildId(list[0].id)
      })
      .catch(() => {})
  }, [user?.id])

  // When selected child changes, load their saved preferences from BE
  useEffect(() => {
    if (!selectedChildId) return
    setIsLoadingChild(true)
    apiGetPreferences(selectedChildId)
      .then(record => {
        if (Object.keys(record).length === 0) return // no overrides yet — keep local defaults
        updatePreferences({
          fontSize:     (record.fontSize as FontSize)       || preferences.fontSize,
          colorScheme:  (record.colorScheme as ColorScheme) || preferences.colorScheme,
          fontFamily:   (record.fontFamily as FontFamily)   || preferences.fontFamily,
          reducedMotion: record.reducedMotion === 'true',
          highContrast:  record.highContrast  === 'true',
          soundEnabled:  record.soundEnabled  !== 'false',
        })
      })
      .catch(() => {})
      .finally(() => setIsLoadingChild(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId])

  const handleSave = async () => {
    if (!selectedChildId) {
      toast.error(t('settings.selectChildBeforeSave'))
      return
    }
    setIsSaving(true)
    try {
      await apiSetPreferences(selectedChildId, {
        fontSize:      preferences.fontSize,
        colorScheme:   preferences.colorScheme,
        fontFamily:    preferences.fontFamily,
        reducedMotion: String(preferences.reducedMotion),
        highContrast:  String(preferences.highContrast),
        soundEnabled:  String(preferences.soundEnabled),
      })
      const childName = children.find(c => c.id === selectedChildId)
      const name = childName ? `${childName.firstName} ${childName.lastName}`.trim() : ''
      toast.success(t('settings.savedForChild', { name }))
    } catch {
      toast.error(t('settings.savePreferencesError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    resetPreferences()
    toast.success(t('settings.resetSuccess'))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.preferences')}
        description={t('settings.syncDesc')}
      >
        <Button variant="outline" onClick={handleReset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('settings.reset')}
        </Button>
      </PageHeader>

      {/* Child selector */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-indigo-500" />
            {t('settings.preferencesForTitle')}
          </CardTitle>
          <CardDescription>
            {t('settings.preferencesForDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('settings.noChildrenForPrefs')}</p>
          ) : (
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder={t('statistics.selectChild')} />
              </SelectTrigger>
              <SelectContent>
                {children.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {isLoadingChild ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t('settings.loadingPreferences')}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Settings column */}
          <div className="space-y-6">
            {/* Font size */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>{t('settings.fontSize')}</CardTitle>
                <CardDescription>{t('settings.fontSizeDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={preferences.fontSize}
                  onValueChange={(v) => updatePreferences({ fontSize: v as FontSize })}
                  className="grid grid-cols-2 gap-4"
                >
                  {fontSizes.map(size => (
                    <div key={size.value}>
                      <RadioGroupItem value={size.value} id={size.value} className="peer sr-only" />
                      <Label
                        htmlFor={size.value}
                        className={cn(
                          'flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer',
                          'peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary'
                        )}
                      >
                        <span style={{ fontSize: size.size }} className="font-medium mb-2">Aa</span>
                        <span className="text-xs text-muted-foreground">
                          {t(`settings.fontSizes.${size.value === 'extra-large' ? 'extraLarge' : size.value}`)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Font family */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>{t('settings.fontFamily')}</CardTitle>
                <CardDescription>{t('settings.fontFamilyDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={preferences.fontFamily}
                  onValueChange={(v) => updatePreferences({ fontFamily: v as FontFamily })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map(f => (
                      <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.stack }}>
                        {t(`settings.fontFamilies.${f.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.fontFamilyWhy')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Color scheme */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>{t('settings.colorScheme')}</CardTitle>
                <CardDescription>{t('settings.colorSchemeDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={preferences.colorScheme}
                  onValueChange={(v) => updatePreferences({ colorScheme: v as ColorScheme })}
                  className="grid grid-cols-2 gap-4"
                >
                  {colorSchemes.map(scheme => (
                    <div key={scheme.value}>
                      <RadioGroupItem value={scheme.value} id={scheme.value} className="peer sr-only" />
                      <Label
                        htmlFor={scheme.value}
                        className={cn(
                          'flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer',
                          'peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary'
                        )}
                      >
                        <div className="flex gap-1 mb-2">
                          {scheme.colors.map((color, i) => (
                            <div key={i} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {t(`settings.colorSchemes.${scheme.value === 'high-contrast' ? 'highContrast' : scheme.value}`)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.colorSchemeWhy')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Accessibility */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>{t('settings.accessibility')}</CardTitle>
                <CardDescription>{t('settings.accessibilityDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {([
                  ['reducedMotion', t('settings.reducedMotion'), t('settings.reducedMotionDesc')],
                  ['highContrast',  t('settings.highContrast'),  t('settings.highContrastDesc')],
                  ['soundEnabled',  t('settings.soundEnabled'),  t('settings.soundEnabledDesc')],
                ] as [keyof typeof preferences, string, string][]).map(([key, label, desc]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label>{label}</Label>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={preferences[key] as boolean}
                      onCheckedChange={(v) => updatePreferences({ [key]: v })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Preview column */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  {t('settings.preview')}
                </CardTitle>
                <CardDescription>{t('settings.previewDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mx-auto max-w-[260px]">
                  <div className="rounded-[2rem] border-8 border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xl">
                    <div className="bg-gray-800 text-white text-xs py-1 px-4 flex justify-between">
                      <span>9:41</span><span>100%</span>
                    </div>
                    <div
                      className={cn(
                        'p-4 min-h-[380px]',
                        // Black-on-yellow per Alonso-Virgós et al. (2018) — see
                        // ACCESSIBILITY_RESEARCH.md — not a generic black/white invert.
                        preferences.colorScheme === 'high-contrast' && 'bg-yellow-300 text-black',
                        preferences.colorScheme === 'pastel' && 'bg-indigo-50',
                        preferences.colorScheme === 'warm' && 'bg-orange-50'
                      )}
                      style={{
                        fontSize: fontSizes.find(f => f.value === preferences.fontSize)?.size,
                        fontFamily: fontFamilies.find(f => f.value === preferences.fontFamily)?.stack,
                      }}
                    >
                      <div className={cn(
                        'rounded-lg p-3 mb-4',
                        preferences.colorScheme === 'default'       && 'bg-indigo-500',
                        preferences.colorScheme === 'high-contrast' && 'bg-black text-yellow-300',
                        preferences.colorScheme === 'pastel'        && 'bg-indigo-200',
                        preferences.colorScheme === 'warm'          && 'bg-orange-400'
                      )}>
                        <span className={cn('font-bold', preferences.colorScheme !== 'high-contrast' && 'text-white')}>
                          {t('settings.previewAppName')}
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div className={cn('rounded-xl p-6 text-center',
                          preferences.colorScheme === 'default'       && 'bg-indigo-100',
                          preferences.colorScheme === 'high-contrast' && 'bg-yellow-300 border-2 border-black',
                          preferences.colorScheme === 'pastel'        && 'bg-indigo-100',
                          preferences.colorScheme === 'warm'          && 'bg-orange-100'
                        )}>
                          <span
                            className="text-6xl font-bold"
                            style={{
                              color: preferences.colorScheme === 'high-contrast'
                                ? '#000000'
                                : colorSchemes.find(c => c.value === preferences.colorScheme)?.colors[0],
                            }}
                          >A</span>
                        </div>
                        <p className={cn('text-center', preferences.highContrast && 'font-bold')}>
                          {t('settings.previewFindLetter')}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {['A', 'B', 'C'].map(letter => (
                            <button key={letter} className={cn(
                              'rounded-lg p-3 font-bold transition-transform',
                              !preferences.reducedMotion && 'hover:scale-105',
                              preferences.colorScheme === 'default'       && 'bg-gray-100',
                              preferences.colorScheme === 'high-contrast' && 'bg-black text-yellow-300 border-2 border-black',
                              preferences.colorScheme === 'pastel'        && 'bg-white',
                              preferences.colorScheme === 'warm'          && 'bg-white'
                            )}>
                              {letter}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-800 py-2 flex justify-center">
                      <div className="w-24 h-1 bg-gray-600 rounded-full" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-indigo-50/50 dark:bg-indigo-900/10">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                    <RefreshCw className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{t('settings.syncPreferences')}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('settings.syncPreferencesDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleReset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('settings.reset')}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !selectedChildId || children.length === 0}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}
