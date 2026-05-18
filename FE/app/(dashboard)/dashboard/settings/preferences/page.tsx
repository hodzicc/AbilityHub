'use client'

import { useTranslation, usePreferences } from '@/components/providers'
import { PageHeader } from '@/components/shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import type { FontSize, ColorScheme } from '@/lib/types'
import { toast } from 'sonner'
import { Smartphone, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const fontSizes: { value: FontSize; label: string; size: string }[] = [
  { value: 'small', label: 'Mala', size: '14px' },
  { value: 'medium', label: 'Srednja', size: '16px' },
  { value: 'large', label: 'Velika', size: '18px' },
  { value: 'extra-large', label: 'Vrlo velika', size: '20px' },
]

const colorSchemes: { value: ColorScheme; label: string; colors: string[] }[] = [
  { value: 'default', label: 'Zadana', colors: ['#4F46E5', '#10B981', '#F59E0B'] },
  { value: 'high-contrast', label: 'Visoki kontrast', colors: ['#000000', '#FFFFFF', '#FF0000'] },
  { value: 'pastel', label: 'Pastelne', colors: ['#A5B4FC', '#86EFAC', '#FDE68A'] },
  { value: 'warm', label: 'Tople', colors: ['#F97316', '#FBBF24', '#EF4444'] },
]

export default function PreferencesPage() {
  const { t } = useTranslation()
  const { preferences, updatePreferences, resetPreferences } = usePreferences()

  const handleSave = () => {
    toast.success(t('settings.saveSuccess'))
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings Column */}
        <div className="space-y-6">
          {/* Font Size */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.fontSize')}</CardTitle>
              <CardDescription>
                Veličina teksta u mobilnim aplikacijama
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={preferences.fontSize} 
                onValueChange={(value) => updatePreferences({ fontSize: value as FontSize })}
                className="grid grid-cols-2 gap-4"
              >
                {fontSizes.map(size => (
                  <div key={size.value}>
                    <RadioGroupItem 
                      value={size.value} 
                      id={size.value} 
                      className="peer sr-only" 
                    />
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

          {/* Color Scheme */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.colorScheme')}</CardTitle>
              <CardDescription>
                Shema boja za mobilne aplikacije
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={preferences.colorScheme} 
                onValueChange={(value) => updatePreferences({ colorScheme: value as ColorScheme })}
                className="grid grid-cols-2 gap-4"
              >
                {colorSchemes.map(scheme => (
                  <div key={scheme.value}>
                    <RadioGroupItem 
                      value={scheme.value} 
                      id={scheme.value} 
                      className="peer sr-only" 
                    />
                    <Label
                      htmlFor={scheme.value}
                      className={cn(
                        'flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer',
                        'peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary'
                      )}
                    >
                      <div className="flex gap-1 mb-2">
                        {scheme.colors.map((color, i) => (
                          <div 
                            key={i} 
                            className="h-6 w-6 rounded-full border"
                            style={{ backgroundColor: color }}
                          />
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
          <Card>
            <CardHeader>
              <CardTitle>Pristupačnost</CardTitle>
              <CardDescription>
                Postavke pristupačnosti za mobilne aplikacije
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.reducedMotion')}</Label>
                  <p className="text-xs text-muted-foreground">
                    Smanji animacije i pokrete
                  </p>
                </div>
                <Switch 
                  checked={preferences.reducedMotion}
                  onCheckedChange={(checked) => updatePreferences({ reducedMotion: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.highContrast')}</Label>
                  <p className="text-xs text-muted-foreground">
                    Povećaj kontrast teksta i elemenata
                  </p>
                </div>
                <Switch 
                  checked={preferences.highContrast}
                  onCheckedChange={(checked) => updatePreferences({ highContrast: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.soundEnabled')}</Label>
                  <p className="text-xs text-muted-foreground">
                    Omogući zvučne efekte i povratne informacije
                  </p>
                </div>
                <Switch 
                  checked={preferences.soundEnabled}
                  onCheckedChange={(checked) => updatePreferences({ soundEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {t('settings.preview')}
              </CardTitle>
              <CardDescription>
                {t('settings.previewDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mobile Preview */}
              <div className="mx-auto max-w-[280px]">
                <div className="rounded-[2rem] border-8 border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xl">
                  {/* Status bar */}
                  <div className="bg-gray-800 text-white text-xs py-1 px-4 flex justify-between">
                    <span>9:41</span>
                    <span>100%</span>
                  </div>
                  
                  {/* App content */}
                  <div 
                    className={cn(
                      'p-4 min-h-[400px]',
                      preferences.colorScheme === 'high-contrast' && 'bg-black text-white',
                      preferences.colorScheme === 'pastel' && 'bg-indigo-50',
                      preferences.colorScheme === 'warm' && 'bg-orange-50'
                    )}
                    style={{ 
                      fontSize: fontSizes.find(f => f.value === preferences.fontSize)?.size 
                    }}
                  >
                    {/* Header */}
                    <div 
                      className={cn(
                        'rounded-lg p-3 mb-4',
                        preferences.colorScheme === 'default' && 'bg-indigo-500',
                        preferences.colorScheme === 'high-contrast' && 'bg-white text-black',
                        preferences.colorScheme === 'pastel' && 'bg-indigo-200',
                        preferences.colorScheme === 'warm' && 'bg-orange-400'
                      )}
                    >
                      <span className={cn(
                        'font-bold',
                        preferences.colorScheme !== 'high-contrast' && 'text-white'
                      )}>
                        Učimo Slova
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-4">
                      <div className={cn(
                        'rounded-xl p-6 text-center',
                        preferences.colorScheme === 'default' && 'bg-indigo-100',
                        preferences.colorScheme === 'high-contrast' && 'bg-white text-black border-2 border-white',
                        preferences.colorScheme === 'pastel' && 'bg-indigo-100',
                        preferences.colorScheme === 'warm' && 'bg-orange-100'
                      )}>
                        <span className="text-6xl font-bold" style={{
                          color: colorSchemes.find(c => c.value === preferences.colorScheme)?.colors[0]
                        }}>
                          A
                        </span>
                      </div>
                      
                      <p className={cn(
                        'text-center',
                        preferences.highContrast && 'font-bold'
                      )}>
                        Pronađi slovo A
                      </p>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {['A', 'B', 'C'].map((letter) => (
                          <button
                            key={letter}
                            className={cn(
                              'rounded-lg p-3 font-bold transition-transform',
                              !preferences.reducedMotion && 'hover:scale-105',
                              preferences.colorScheme === 'default' && 'bg-gray-100 hover:bg-indigo-100',
                              preferences.colorScheme === 'high-contrast' && 'bg-white text-black border-2 border-black',
                              preferences.colorScheme === 'pastel' && 'bg-white hover:bg-indigo-50',
                              preferences.colorScheme === 'warm' && 'bg-white hover:bg-orange-50'
                            )}
                          >
                            {letter}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Home indicator */}
                  <div className="bg-gray-800 py-2 flex justify-center">
                    <div className="w-24 h-1 bg-gray-600 rounded-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sync Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">{t('settings.syncPreferences')}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ove postavke će se automatski sinhronizovati sa svim mobilnim aplikacijama 
                    koje koristi vaše dijete. Promjene će biti vidljive pri sljedećem pokretanju aplikacije.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}
