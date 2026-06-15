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
import type { FontSize, ColorScheme } from '@/lib/types'
import { toast } from 'sonner'
import { Smartphone, RefreshCw, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  apiGetChildren,
  apiGetPreferences,
  apiSetPreferences,
  type UserProfileResponse,
} from '@/lib/api'

const fontSizes: { value: FontSize; label: string; size: string }[] = [
  { value: 'small',       label: 'Mala',       size: '14px' },
  { value: 'medium',      label: 'Srednja',    size: '16px' },
  { value: 'large',       label: 'Velika',     size: '18px' },
  { value: 'extra-large', label: 'Vrlo velika', size: '20px' },
]

const colorSchemes: { value: ColorScheme; label: string; colors: string[] }[] = [
  { value: 'default',       label: 'Zadana',         colors: ['#4F46E5', '#10B981', '#F59E0B'] },
  { value: 'high-contrast', label: 'Visoki kontrast', colors: ['#000000', '#FFFFFF', '#FF0000'] },
  { value: 'pastel',        label: 'Pastelne',        colors: ['#A5B4FC', '#86EFAC', '#FDE68A'] },
  { value: 'warm',          label: 'Tople',           colors: ['#F97316', '#FBBF24', '#EF4444'] },
]

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
      toast.error('Odaberite dijete prije čuvanja')
      return
    }
    setIsSaving(true)
    try {
      await apiSetPreferences(selectedChildId, {
        fontSize:      preferences.fontSize,
        colorScheme:   preferences.colorScheme,
        reducedMotion: String(preferences.reducedMotion),
        highContrast:  String(preferences.highContrast),
        soundEnabled:  String(preferences.soundEnabled),
      })
      const childName = children.find(c => c.id === selectedChildId)
      const name = childName ? `${childName.firstName} ${childName.lastName}`.trim() : 'dijete'
      toast.success(`Preferencije za ${name} sačuvane`)
    } catch {
      toast.error('Greška pri čuvanju preferencija')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    resetPreferences()
    toast.success('Preferencije su resetovane na zadane vrijednosti')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.preferences')}
        description={t('settings.syncDesc')}
      >
        <Button variant="outline" onClick={handleReset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Resetuj
        </Button>
      </PageHeader>

      {/* Child selector */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-indigo-500" />
            Za koje dijete mijenjate preferencije?
          </CardTitle>
          <CardDescription>
            Odaberite dijete — preferencije se čuvaju zasebno za svako dijete i šalju se svim njihovim aplikacijama.
            Za postavke po pojedinoj aplikaciji, posjetite profil djeteta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nemate dodane djece. Dodajte dijete u odjeljku Djeca.</p>
          ) : (
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Odaberite dijete..." />
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
          Učitavanje preferencija...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Settings column */}
          <div className="space-y-6">
            {/* Font size */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>{t('settings.fontSize')}</CardTitle>
                <CardDescription>Veličina teksta u mobilnim aplikacijama</CardDescription>
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
                        <span className="text-xs text-muted-foreground">{size.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Color scheme */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>{t('settings.colorScheme')}</CardTitle>
                <CardDescription>Shema boja za mobilne aplikacije</CardDescription>
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
                        <span className="text-xs text-muted-foreground">{scheme.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Accessibility */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Pristupačnost</CardTitle>
                <CardDescription>Postavke pristupačnosti za mobilne aplikacije</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {([
                  ['reducedMotion', t('settings.reducedMotion'), 'Smanji animacije i pokrete'],
                  ['highContrast',  t('settings.highContrast'),  'Povećaj kontrast teksta i elemenata'],
                  ['soundEnabled',  t('settings.soundEnabled'),  'Omogući zvučne efekte i povratne informacije'],
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
                        preferences.colorScheme === 'high-contrast' && 'bg-black text-white',
                        preferences.colorScheme === 'pastel' && 'bg-indigo-50',
                        preferences.colorScheme === 'warm' && 'bg-orange-50'
                      )}
                      style={{ fontSize: fontSizes.find(f => f.value === preferences.fontSize)?.size }}
                    >
                      <div className={cn(
                        'rounded-lg p-3 mb-4',
                        preferences.colorScheme === 'default'       && 'bg-indigo-500',
                        preferences.colorScheme === 'high-contrast' && 'bg-white text-black',
                        preferences.colorScheme === 'pastel'        && 'bg-indigo-200',
                        preferences.colorScheme === 'warm'          && 'bg-orange-400'
                      )}>
                        <span className={cn('font-bold', preferences.colorScheme !== 'high-contrast' && 'text-white')}>
                          Učimo Slova
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div className={cn('rounded-xl p-6 text-center',
                          preferences.colorScheme === 'default'       && 'bg-indigo-100',
                          preferences.colorScheme === 'high-contrast' && 'bg-white text-black border-2 border-white',
                          preferences.colorScheme === 'pastel'        && 'bg-indigo-100',
                          preferences.colorScheme === 'warm'          && 'bg-orange-100'
                        )}>
                          <span className="text-6xl font-bold" style={{
                            color: colorSchemes.find(c => c.value === preferences.colorScheme)?.colors[0]
                          }}>A</span>
                        </div>
                        <p className={cn('text-center', preferences.highContrast && 'font-bold')}>
                          Pronađi slovo A
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {['A', 'B', 'C'].map(letter => (
                            <button key={letter} className={cn(
                              'rounded-lg p-3 font-bold transition-transform',
                              !preferences.reducedMotion && 'hover:scale-105',
                              preferences.colorScheme === 'default'       && 'bg-gray-100',
                              preferences.colorScheme === 'high-contrast' && 'bg-white text-black border-2 border-black',
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
                      Ove postavke se automatski sinhronizuju sa svim mobilnim aplikacijama
                      koje koristi odabrano dijete. Promjene će biti vidljive pri sljedećem pokretanju aplikacije.
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
          Resetuj
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
