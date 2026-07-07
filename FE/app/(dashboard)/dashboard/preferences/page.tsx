'use client'

import { useState, useEffect } from 'react'
import { useAuth, useTranslation, usePreferences } from '@/components/providers'
import { PageHeader, ConfirmationDialog } from '@/components/shared'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { FontSize, ColorScheme, FontFamily } from '@/lib/types'
import { FONT_SIZES as fontSizes, COLOR_SCHEMES as colorSchemes, FONT_FAMILIES as fontFamilies } from '@/lib/preferences'
import { PreferencePreview } from '@/components/preferences'
import { toast } from 'sonner'
import { Smartphone, Globe, RefreshCw, Loader2, Info } from 'lucide-react'
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
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [previewPlatform, setPreviewPlatform] = useState<'mobile' | 'web'>('mobile')

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

  const handleReset = () => setIsResetConfirmOpen(true)

  const confirmReset = () => {
    resetPreferences()
    setIsResetConfirmOpen(false)
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
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{t('settings.whyThisChoice')} </span>
                    {t(`settings.fontSizeReasons.${preferences.fontSize === 'extra-large' ? 'extraLarge' : preferences.fontSize}`)}
                  </p>
                </div>
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
                    <span className="font-medium text-foreground">{t('settings.whyThisChoice')} </span>
                    {t(`settings.fontFamilyReasons.${preferences.fontFamily}`)}
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
                    <span className="font-medium text-foreground">{t('settings.whyThisChoice')} </span>
                    {t(`settings.colorSchemeReasons.${preferences.colorScheme === 'high-contrast' ? 'highContrast' : preferences.colorScheme}`)}
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
                <Tabs value={previewPlatform} onValueChange={(v) => setPreviewPlatform(v as 'mobile' | 'web')}>
                  <TabsList className="mb-4 grid w-full grid-cols-2">
                    <TabsTrigger value="mobile">
                      <Smartphone className="mr-1.5 h-3.5 w-3.5" />
                      {t('settings.previewMobile')}
                    </TabsTrigger>
                    <TabsTrigger value="web">
                      <Globe className="mr-1.5 h-3.5 w-3.5" />
                      {t('settings.previewWeb')}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="mobile">
                    <PreferencePreview preferences={preferences} platform="mobile" />
                  </TabsContent>
                  <TabsContent value="web">
                    <PreferencePreview preferences={preferences} platform="web" />
                  </TabsContent>
                </Tabs>
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

      <ConfirmationDialog
        open={isResetConfirmOpen}
        onOpenChange={setIsResetConfirmOpen}
        title={t('settings.resetConfirmTitle')}
        description={t('settings.resetConfirmDesc')}
        confirmLabel={t('settings.reset')}
        variant="destructive"
        onConfirm={confirmReset}
      />
    </div>
  )
}
