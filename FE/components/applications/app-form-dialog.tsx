'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '@/components/providers'
import { apiRegisterApp, apiUpdateApp, type ApplicationResponse } from '@/lib/api'
import { APP_CATEGORIES } from '@/lib/constants'
import { toast } from 'sonner'

interface AppForm {
  key: string; name: string; description: string
  category: string; platform: string; version: string
  dataFormat: string; color: string; minAge: string; maxAge: string
}

function emptyForm(): AppForm {
  return {
    key: '', name: '', description: '', category: 'education',
    platform: 'Mobile', version: '1.0.0', dataFormat: 'abilityhub.usage.v1',
    color: '#4F46E5', minAge: '3', maxAge: '18',
  }
}

function appToForm(a: ApplicationResponse): AppForm {
  return {
    key: a.key,
    name: a.name,
    description: a.description,
    category: a.category || 'education',
    platform: a.platform || 'Mobile',
    version: a.version,
    dataFormat: a.dataFormat,
    color: a.color || '#4F46E5',
    minAge: String(a.minAge),
    maxAge: String(a.maxAge),
  }
}

interface AppFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pass an existing app to edit it; omit to create a new one. */
  app?: ApplicationResponse
  onSaved: () => Promise<void> | void
}

/**
 * Admin-only create/edit dialog for the application catalog (CRUD).
 * In edit mode the key (slug) is immutable and IsActive/icon/features are preserved as-is.
 */
export function AppFormDialog({ open, onOpenChange, app, onSaved }: AppFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = !!app
  const [form, setForm] = useState<AppForm>(() => app ? appToForm(app) : emptyForm())
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(app ? appToForm(app) : emptyForm())
  }, [open, app])

  const handleCategoryChange = (cat: string) => {
    const defaultColor = APP_CATEGORIES.find(c => c.value === cat)?.color
    setForm(f => ({ ...f, category: cat, color: isEdit ? f.color : (defaultColor ?? f.color) }))
  }

  const handleSave = async () => {
    if (!form.key || !form.name) { toast.error(t('applications.requiredFields')); return }
    setIsSaving(true)
    try {
      if (isEdit && app) {
        await apiUpdateApp(app.id, {
          name: form.name,
          platform: form.platform,
          version: form.version,
          dataFormat: form.dataFormat,
          description: form.description,
          isActive: app.isActive,
          category: form.category,
          iconName: app.iconName,
          color: form.color,
          minAge: Number(form.minAge),
          maxAge: Number(form.maxAge),
          featuresJson: app.featuresJson,
        })
        toast.success(t('applications.updatedToast', { name: form.name }))
      } else {
        await apiRegisterApp({
          key: form.key,
          name: form.name,
          description: form.description,
          category: form.category,
          platform: form.platform,
          version: form.version,
          dataFormat: form.dataFormat,
          color: form.color,
          minAge: Number(form.minAge),
          maxAge: Number(form.maxAge),
          iconName: 'AppWindow',
          featuresJson: '[]',
        })
        toast.success(t('applications.addedToast', { name: form.name }))
      }
      onOpenChange(false)
      await onSaved()
    } catch {
      toast.error(isEdit ? t('applications.updateError') : t('applications.addError'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={open => { onOpenChange(open); if (!open) setForm(emptyForm()) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('applications.editApp') : t('applications.addApp')}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('applications.editAppDesc', { name: app?.name ?? '' })
              : t('applications.addAppDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('applications.name')} *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('applications.namePlaceholder')} disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label>{t('applications.keyLabel')} *</Label>
              <Input
                value={form.key}
                onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                placeholder={t('applications.keyPlaceholder')}
                disabled={isSaving || isEdit}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('applications.description')}</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} disabled={isSaving} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('applications.category')}</Label>
              <Select value={form.category} onValueChange={handleCategoryChange} disabled={isSaving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {APP_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{t(cat.i18nKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('applications.platform')}</Label>
              <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))} disabled={isSaving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mobile">{t('applications.platformMobile')}</SelectItem>
                  <SelectItem value="Web">{t('applications.platformWeb')}</SelectItem>
                  <SelectItem value="Both">{t('applications.platformBoth')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>{t('applications.version')}</Label>
              <Input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0.0" disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label>{t('applications.minAge')}</Label>
              <Input type="number" min={0} max={18} value={form.minAge} onChange={e => setForm(f => ({ ...f, minAge: e.target.value }))} disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label>{t('applications.maxAge')}</Label>
              <Input type="number" min={0} max={18} value={form.maxAge} onChange={e => setForm(f => ({ ...f, maxAge: e.target.value }))} disabled={isSaving} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="space-y-2 flex-1">
              <Label>{t('applications.dataFormat')}</Label>
              <Input value={form.dataFormat} onChange={e => setForm(f => ({ ...f, dataFormat: e.target.value }))} placeholder={t('applications.dataFormatPlaceholder')} disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label>{t('applications.color')}</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-9 w-12 cursor-pointer rounded border" disabled={isSaving} />
                <span className="text-xs text-muted-foreground">{form.color}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={isSaving || !form.key || !form.name}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? t('applications.saveChanges') : t('applications.addApp')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
