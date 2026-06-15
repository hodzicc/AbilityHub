'use client'

import { useState, useEffect } from 'react'
import { useAuth, useTranslation } from '@/components/providers'
import { PageHeader, EmptyState } from '@/components/shared'
import { AppCard } from '@/components/applications'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Application, AppCategory } from '@/lib/types'
import { Search, AppWindow, Plus, Loader2 } from 'lucide-react'
import { apiGetApps, apiGetChildren, apiGetChildApps, apiRegisterApp, type ApplicationResponse } from '@/lib/api'
import { toast } from 'sonner'

const categories: (AppCategory | 'all')[] = ['all', 'education', 'speech', 'motor', 'daily', 'games']

const CATEGORY_COLORS: Record<string, string> = {
  education: '#4F46E5',
  speech:    '#8B5CF6',
  motor:     '#EF4444',
  daily:     '#F97316',
  games:     '#10B981',
}

interface AppForm {
  key: string; name: string; description: string
  category: string; platform: string; version: string
  dataFormat: string; color: string; minAge: string; maxAge: string
}

const EMPTY_FORM: AppForm = {
  key: '', name: '', description: '', category: 'education',
  platform: 'Mobile', version: '1.0.0', dataFormat: 'abilityhub.usage.v1',
  color: '#4F46E5', minAge: '3', maxAge: '18',
}

function responseToApp(r: ApplicationResponse): Application {
  let features: string[] = []
  try { features = JSON.parse(r.featuresJson) } catch {}
  return {
    id: r.id, key: r.key, name: r.name, description: r.description,
    category: (r.category as AppCategory) || 'education',
    icon: r.iconName || 'AppWindow', color: r.color || '#4F46E5',
    minAge: r.minAge, maxAge: r.maxAge, features,
    isActive: r.isActive,
    platform: (r.platform?.toLowerCase() as 'web' | 'mobile' | 'hybrid') || 'mobile',
    dataFormat: r.dataFormat, version: r.version,
  }
}

export default function ApplicationsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [apps, setApps] = useState<Application[]>([])
  const [assignedCounts, setAssignedCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'all'>('all')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [form, setForm] = useState<AppForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)

  const isAdmin = user?.role === 'admin'

  const loadApps = async () => {
    setIsLoading(true)
    try {
      const [appsData, children] = await Promise.all([
        apiGetApps(isAdmin),
        user && !isAdmin ? apiGetChildren(user.id).catch(() => []) : Promise.resolve([]),
      ])
      setApps(appsData.map(responseToApp))

      if (children.length > 0) {
        const counts: Record<string, number> = {}
        await Promise.all(
          children.map(async child => {
            const childApps = await apiGetChildApps(child.id).catch(() => [])
            childApps.forEach(ca => { counts[ca.applicationId] = (counts[ca.applicationId] ?? 0) + 1 })
          })
        )
        setAssignedCounts(counts)
      }
    } catch {
      toast.error('Greška pri učitavanju aplikacija')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadApps() }, [user?.id])

  const handleCategoryChange = (cat: string) => {
    setForm(f => ({ ...f, category: cat, color: CATEGORY_COLORS[cat] ?? f.color }))
  }

  const handleAdd = async () => {
    if (!form.key || !form.name) { toast.error('Ključ i naziv su obavezni'); return }
    setIsSaving(true)
    try {
      await apiRegisterApp({
        key: form.key, name: form.name, description: form.description,
        category: form.category, platform: form.platform, version: form.version,
        dataFormat: form.dataFormat, color: form.color,
        minAge: Number(form.minAge), maxAge: Number(form.maxAge),
        iconName: 'AppWindow', featuresJson: '[]',
      })
      toast.success(`Aplikacija "${form.name}" dodana`)
      setIsAddOpen(false)
      setForm(EMPTY_FORM)
      await loadApps()
    } catch {
      toast.error('Greška pri dodavanju aplikacije')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredApps = apps.filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t('applications.title')} description={t('applications.subtitle')}>
        {isAdmin && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Dodaj aplikaciju
          </Button>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`${t('common.search')}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              className={selectedCategory === category
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-sm'
                : 'hover:border-primary/60'}
              onClick={() => setSelectedCategory(category as AppCategory | 'all')}
            >
              {category === 'all' ? t('common.all') : t(`applications.categories.${category}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Apps Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredApps.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredApps.map(app => (
            <AppCard key={app.id} app={app} assignedCount={assignedCounts[app.id] ?? 0} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={AppWindow}
          title={searchQuery ? 'Nema rezultata pretrage' : t('applications.noApps')}
          description={searchQuery ? 'Pokušajte s drugim pojmom' : t('applications.noAppsDesc')}
          action={isAdmin && !searchQuery ? { label: 'Dodaj aplikaciju', onClick: () => setIsAddOpen(true) } : undefined}
        />
      )}

      {/* Add Application Dialog (admin only) */}
      <Dialog open={isAddOpen} onOpenChange={open => { setIsAddOpen(open); if (!open) setForm(EMPTY_FORM) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dodaj aplikaciju</DialogTitle>
            <DialogDescription>Registruj novu aplikaciju u katalog platforme.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Naziv *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Učimo Slova" disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>Ključ (slug) *</Label>
                <Input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} placeholder="ucimo-slova" disabled={isSaving} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Opis</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} disabled={isSaving} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kategorija</Label>
                <Select value={form.category} onValueChange={handleCategoryChange} disabled={isSaving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="education">Edukacija</SelectItem>
                    <SelectItem value="speech">Govor</SelectItem>
                    <SelectItem value="motor">Motorika</SelectItem>
                    <SelectItem value="daily">Dnevna rutina</SelectItem>
                    <SelectItem value="games">Igre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Platforma</Label>
                <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))} disabled={isSaving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mobile">Mobilna</SelectItem>
                    <SelectItem value="Web">Web</SelectItem>
                    <SelectItem value="Both">Oboje</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Verzija</Label>
                <Input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0.0" disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>Min. uzrast</Label>
                <Input type="number" min={0} max={18} value={form.minAge} onChange={e => setForm(f => ({ ...f, minAge: e.target.value }))} disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>Maks. uzrast</Label>
                <Input type="number" min={0} max={18} value={form.maxAge} onChange={e => setForm(f => ({ ...f, maxAge: e.target.value }))} disabled={isSaving} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="space-y-2 flex-1">
                <Label>Format podataka</Label>
                <Input value={form.dataFormat} onChange={e => setForm(f => ({ ...f, dataFormat: e.target.value }))} placeholder="abilityhub.usage.v1" disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>Boja</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-9 w-12 cursor-pointer rounded border" disabled={isSaving} />
                  <span className="text-xs text-muted-foreground">{form.color}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isSaving}>Odustani</Button>
            <Button onClick={handleAdd} disabled={isSaving || !form.key || !form.name}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Dodaj aplikaciju
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
