'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COLOR_SCHEMES, FONT_FAMILIES, FONT_SIZES } from '@/lib/preferences'
import { useTranslation } from '@/components/providers'
import type { UIPreferences } from '@/lib/types'

interface PreferenceFieldsProps {
  value: UIPreferences
  onChange: (value: UIPreferences) => void
  /** Unique prefix for radio input ids so multiple instances can coexist on one page. */
  idPrefix: string
}

/**
 * Font size / font family / color scheme / accessibility toggle controls —
 * shared between the global preferences form and the per-app override panel
 * so both look and behave identically.
 */
export function PreferenceFields({ value, onChange, idPrefix }: PreferenceFieldsProps) {
  const { t } = useTranslation()

  const TOGGLES: [keyof UIPreferences, string, string][] = [
    ['reducedMotion', t('settings.reducedMotion'), t('settings.reducedMotionDesc')],
    ['highContrast', t('settings.highContrast'), t('settings.highContrastDesc')],
    ['soundEnabled', t('settings.soundEnabled'), t('settings.soundEnabledDesc')],
  ]

  return (
    <div className="space-y-5">
      {/* Font size */}
      <div>
        <p className="mb-2 text-sm font-medium">{t('preferencesPanel.fontSizeLabel')}</p>
        <RadioGroup
          value={value.fontSize}
          onValueChange={v => onChange({ ...value, fontSize: v as UIPreferences['fontSize'] })}
          className="grid grid-cols-4 gap-2"
        >
          {FONT_SIZES.map(fs => (
            <div key={fs.value}>
              <RadioGroupItem value={fs.value} id={`${idPrefix}-${fs.value}`} className="peer sr-only" />
              <Label
                htmlFor={`${idPrefix}-${fs.value}`}
                className={cn(
                  'flex flex-col items-center rounded-lg border-2 border-muted bg-popover p-2 cursor-pointer text-xs',
                  'peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary'
                )}
              >
                <span style={{ fontSize: fs.size }} className="font-bold">Aa</span>
                {t(`settings.fontSizes.${fs.value === 'extra-large' ? 'extraLarge' : fs.value}`)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Font family */}
      <div>
        <p className="mb-2 text-sm font-medium">{t('preferencesPanel.fontFamilyLabel')}</p>
        <Select
          value={value.fontFamily}
          onValueChange={v => onChange({ ...value, fontFamily: v as UIPreferences['fontFamily'] })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map(f => (
              <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.stack }}>
                {t(`settings.fontFamilies.${f.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {t(`settings.fontFamilyReasons.${value.fontFamily}`)}
          </p>
        </div>
      </div>

      {/* Color scheme */}
      <div>
        <p className="mb-2 text-sm font-medium">{t('preferencesPanel.colorSchemeLabel')}</p>
        <RadioGroup
          value={value.colorScheme}
          onValueChange={v => onChange({ ...value, colorScheme: v as UIPreferences['colorScheme'] })}
          className="grid grid-cols-2 gap-2"
        >
          {COLOR_SCHEMES.map(cs => (
            <div key={cs.value}>
              <RadioGroupItem value={cs.value} id={`${idPrefix}-${cs.value}`} className="peer sr-only" />
              <Label
                htmlFor={`${idPrefix}-${cs.value}`}
                className={cn(
                  'flex items-center gap-2 rounded-lg border-2 border-muted bg-popover p-2 cursor-pointer text-xs',
                  'peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary'
                )}
              >
                <div className="flex gap-0.5">
                  {cs.colors.map((c, i) => (
                    <div key={i} className="h-4 w-4 rounded-full border" style={{ backgroundColor: c }} />
                  ))}
                </div>
                {t(`settings.colorSchemes.${cs.value === 'high-contrast' ? 'highContrast' : cs.value}`)}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {t(`settings.colorSchemeReasons.${value.colorScheme === 'high-contrast' ? 'highContrast' : value.colorScheme}`)}
          </p>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        {TOGGLES.map(([key, label, desc]) => (
          <div key={key} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">{label}</Label>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Switch
              checked={value[key] as boolean}
              onCheckedChange={v => onChange({ ...value, [key]: v })}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
