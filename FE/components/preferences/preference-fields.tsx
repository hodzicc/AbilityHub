'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { COLOR_SCHEMES, FONT_SIZES } from '@/lib/preferences'
import type { UIPreferences } from '@/lib/types'

interface PreferenceFieldsProps {
  value: UIPreferences
  onChange: (value: UIPreferences) => void
  /** Unique prefix for radio input ids so multiple instances can coexist on one page. */
  idPrefix: string
}

const TOGGLES: [keyof UIPreferences, string, string][] = [
  ['reducedMotion', 'Smanjena animacija', 'Smanji pokrete i prijelaze'],
  ['highContrast', 'Visoki kontrast', 'Povećaj kontrast teksta i elemenata'],
  ['soundEnabled', 'Zvučni efekti', 'Omogući zvukove u aplikacijama'],
]

/**
 * Font size / color scheme / accessibility toggle controls — shared between the
 * global preferences form and the per-app override panel so both look and behave
 * identically.
 */
export function PreferenceFields({ value, onChange, idPrefix }: PreferenceFieldsProps) {
  return (
    <div className="space-y-5">
      {/* Font size */}
      <div>
        <p className="mb-2 text-sm font-medium">Veličina teksta</p>
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
                {fs.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Color scheme */}
      <div>
        <p className="mb-2 text-sm font-medium">Shema boja</p>
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
                {cs.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
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
