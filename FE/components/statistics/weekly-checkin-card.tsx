'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from '@/components/providers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Save, Pencil, Trash2, X, BellRing } from 'lucide-react'
import { toast } from 'sonner'
import type { DayContext, HelpLevel, Mood, PerformanceQuality, WeeklyCheckIn } from '@/lib/types'
import { apiGetWeeklyCheckIns, apiSubmitWeeklyCheckIn, apiDeleteWeeklyCheckIn } from '@/lib/api'
import { currentWeekStart } from '@/lib/utils'

const MOOD_VALUES: Mood[] = ['great', 'good', 'neutral', 'difficult', 'hard']
const HELP_LEVEL_VALUES: HelpLevel[] = ['none', 'minimal', 'moderate', 'extensive']
const QUALITY_VALUES: PerformanceQuality[] = ['excellent', 'good', 'partial', 'poor']
const DAY_CONTEXT_VALUES: DayContext[] = ['normal', 'poor-sleep', 'illness', 'routine-change', 'stress', 'other']

export function WeeklyCheckInCard({ childId, childName }: { childId: string; childName: string }) {
  const { t, locale } = useTranslation()
  const currentWeek = currentWeekStart()
  const [history, setHistory] = useState<WeeklyCheckIn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  // The full evaluation shown in the details popup (opened by double-clicking a row).
  const [detail, setDetail] = useState<WeeklyCheckIn | null>(null)
  // Pending deletion (drives the confirmation dialog).
  const [deleteTarget, setDeleteTarget] = useState<WeeklyCheckIn | null>(null)
  // Which week the form is currently editing (defaults to the current week). Editing
  // a past row from the history retargets the form to that week.
  const [editingWeek, setEditingWeek] = useState(currentWeek)
  const formRef = useRef<HTMLDivElement>(null)

  const [moodBefore, setMoodBefore] = useState<Mood | ''>('')
  const [moodAfter, setMoodAfter] = useState<Mood | ''>('')
  const [helpLevel, setHelpLevel] = useState<HelpLevel | ''>('')
  const [performanceQuality, setPerformanceQuality] = useState<PerformanceQuality | ''>('')
  const [safetyIncident, setSafetyIncident] = useState(false)
  const [safetyIncidentNotes, setSafetyIncidentNotes] = useState('')
  const [dayContext, setDayContext] = useState<DayContext | ''>('')
  const [dayContextNotes, setDayContextNotes] = useState('')
  const [usesSkillOutsideApp, setUsesSkillOutsideApp] = useState(false)
  const [generalNotes, setGeneralNotes] = useState('')

  const dateLocale = locale === 'bs' ? 'bs-BA' : 'en-US'

  // Load the form fields from an evaluation (or clear them for a blank week).
  const fillForm = useCallback((c: WeeklyCheckIn | null) => {
    setMoodBefore(c?.moodBefore ?? '')
    setMoodAfter(c?.moodAfter ?? '')
    setHelpLevel(c?.helpLevel ?? '')
    setPerformanceQuality(c?.performanceQuality ?? '')
    setSafetyIncident(c?.safetyIncident ?? false)
    setSafetyIncidentNotes(c?.safetyIncidentNotes ?? '')
    setDayContext(c?.dayContext ?? '')
    setDayContextNotes(c?.dayContextNotes ?? '')
    setUsesSkillOutsideApp(c?.usesSkillOutsideApp ?? false)
    setGeneralNotes(c?.generalNotes ?? '')
  }, [])

  useEffect(() => {
    setIsLoading(true)
    apiGetWeeklyCheckIns(childId)
      .then(items => {
        setHistory(items)
        setEditingWeek(currentWeek)
        fillForm(items.find(i => i.weekStartDate === currentWeek) ?? null)
      })
      .finally(() => setIsLoading(false))
  }, [childId, currentWeek, fillForm])

  // The evaluation already saved for the week being edited, if any.
  const existing = history.find(h => h.weekStartDate === editingWeek) ?? null
  const isEditingPastWeek = editingWeek !== currentWeek

  const startEdit = (c: WeeklyCheckIn) => {
    setEditingWeek(c.weekStartDate)
    fillForm(c)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const cancelEdit = () => {
    setEditingWeek(currentWeek)
    fillForm(history.find(i => i.weekStartDate === currentWeek) ?? null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const saved = await apiSubmitWeeklyCheckIn({
        childId,
        weekStartDate: editingWeek,
        moodBefore: moodBefore || undefined,
        moodAfter: moodAfter || undefined,
        helpLevel: helpLevel || undefined,
        performanceQuality: performanceQuality || undefined,
        safetyIncident,
        safetyIncidentNotes: safetyIncidentNotes || undefined,
        dayContext: dayContext || undefined,
        dayContextNotes: dayContextNotes || undefined,
        usesSkillOutsideApp,
        generalNotes: generalNotes || undefined,
      })
      setHistory(prev =>
        [saved, ...prev.filter(c => c.id !== saved.id)].sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate))
      )
      toast.success(t('checkins.saveSuccess'))
      if (isEditingPastWeek) cancelEdit()
    } catch {
      toast.error(t('checkins.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const target = deleteTarget
    try {
      await apiDeleteWeeklyCheckIn(childId, target.id)
      setHistory(prev => prev.filter(c => c.id !== target.id))
      // If we deleted the week the form was showing, blank the form for that week.
      if (target.weekStartDate === editingWeek) fillForm(null)
      toast.success(t('checkins.deleteSuccess'))
    } catch {
      toast.error(t('checkins.deleteError'))
    } finally {
      setDeleteTarget(null)
    }
  }

  if (isLoading) return <div className="h-48 bg-muted animate-pulse rounded-lg" />

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card ref={formRef}>
        <CardHeader>
          <CardTitle className="text-lg">{t('checkins.title')} — {childName}</CardTitle>
          <CardDescription>
            {t('checkins.subtitle', { date: new Date(editingWeek).toLocaleDateString(dateLocale) })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingPastWeek && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
              <span>{t('checkins.editingPastWeek', { date: new Date(editingWeek).toLocaleDateString(dateLocale) })}</span>
              <Button variant="ghost" size="sm" className="h-7" onClick={cancelEdit}>
                <X className="mr-1 h-3.5 w-3.5" />{t('checkins.backToCurrent')}
              </Button>
            </div>
          )}
          {!isEditingPastWeek && existing && (
            <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {t('checkins.alreadySubmitted')}
            </p>
          )}
          {!isEditingPastWeek && !existing && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
              <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{t('checkins.reminderNotSubmitted')}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('checkins.moodBefore')}</Label>
              <p className="text-xs text-muted-foreground">{t('checkins.moodBeforeDesc')}</p>
              <Select value={moodBefore} onValueChange={v => setMoodBefore(v as Mood)}>
                <SelectTrigger><SelectValue placeholder={t('checkins.selectPlaceholder')} /></SelectTrigger>
                <SelectContent>{MOOD_VALUES.map(m => <SelectItem key={m} value={m}>{t(`checkins.moods.${m}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('checkins.moodAfter')}</Label>
              <p className="text-xs text-muted-foreground">{t('checkins.moodAfterDesc')}</p>
              <Select value={moodAfter} onValueChange={v => setMoodAfter(v as Mood)}>
                <SelectTrigger><SelectValue placeholder={t('checkins.selectPlaceholder')} /></SelectTrigger>
                <SelectContent>{MOOD_VALUES.map(m => <SelectItem key={m} value={m}>{t(`checkins.moods.${m}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t('checkins.helpLevel')}</Label>
            <p className="text-xs text-muted-foreground">{t('checkins.helpLevelDesc')}</p>
            <Select value={helpLevel} onValueChange={v => setHelpLevel(v as HelpLevel)}>
              <SelectTrigger><SelectValue placeholder={t('checkins.selectPlaceholder')} /></SelectTrigger>
              <SelectContent>{HELP_LEVEL_VALUES.map(h => <SelectItem key={h} value={h}>{t(`checkins.helpLevels.${h}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t('checkins.performanceQuality')}</Label>
            <p className="text-xs text-muted-foreground">{t('checkins.performanceQualityDesc')}</p>
            <Select value={performanceQuality} onValueChange={v => setPerformanceQuality(v as PerformanceQuality)}>
              <SelectTrigger><SelectValue placeholder={t('checkins.selectPlaceholder')} /></SelectTrigger>
              <SelectContent>{QUALITY_VALUES.map(q => <SelectItem key={q} value={q}>{t(`checkins.qualities.${q}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>{t('checkins.safetyIncident')}</Label>
                <p className="text-xs text-muted-foreground">{t('checkins.safetyIncidentDesc')}</p>
              </div>
              <Switch checked={safetyIncident} onCheckedChange={setSafetyIncident} />
            </div>
            {safetyIncident && (
              <Textarea
                placeholder={t('checkins.safetyIncidentPlaceholder')}
                value={safetyIncidentNotes}
                onChange={e => setSafetyIncidentNotes(e.target.value)}
                rows={2}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{t('checkins.dayContext')}</Label>
            <p className="text-xs text-muted-foreground">{t('checkins.dayContextDesc')}</p>
            <Select value={dayContext} onValueChange={v => setDayContext(v as DayContext)}>
              <SelectTrigger><SelectValue placeholder={t('checkins.selectPlaceholder')} /></SelectTrigger>
              <SelectContent>{DAY_CONTEXT_VALUES.map(d => <SelectItem key={d} value={d}>{t(`checkins.dayContexts.${d}`)}</SelectItem>)}</SelectContent>
            </Select>
            {dayContext && dayContext !== 'normal' && (
              <Textarea
                placeholder={t('checkins.dayContextPlaceholder')}
                value={dayContextNotes}
                onChange={e => setDayContextNotes(e.target.value)}
                rows={2}
              />
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <Label>{t('checkins.usesSkillOutsideApp')}</Label>
              <p className="text-xs text-muted-foreground">{t('checkins.usesSkillOutsideAppDesc')}</p>
            </div>
            <Switch checked={usesSkillOutsideApp} onCheckedChange={setUsesSkillOutsideApp} />
          </div>

          <div className="space-y-1.5">
            <Label>{t('checkins.generalNotes')}</Label>
            <p className="text-xs text-muted-foreground">{t('checkins.generalNotesDesc')}</p>
            <Textarea value={generalNotes} onChange={e => setGeneralNotes(e.target.value)} rows={3} />
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {existing ? t('checkins.update') : t('checkins.save')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('checkins.history')}</CardTitle>
          <CardDescription>{t('checkins.historyDesc', { name: childName })}</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('checkins.noHistory')}</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{t('checkins.viewDetailsHint')}</p>
              {history.map(c => (
                <div
                  key={c.id}
                  onDoubleClick={() => setDetail(c)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') setDetail(c) }}
                  title={t('checkins.viewDetailsHint')}
                  className={`cursor-pointer rounded-lg border p-3 text-sm space-y-1 transition-colors hover:bg-muted/50 hover:border-primary/40 ${c.weekStartDate === editingWeek ? 'border-primary/60 ring-1 ring-primary/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">
                      {t('checkins.weekOf', { date: new Date(c.weekStartDate).toLocaleDateString(dateLocale) })}
                    </p>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={e => { e.stopPropagation(); startEdit(c) }}
                        title={t('common.edit')} aria-label={t('common.edit')}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={e => { e.stopPropagation(); setDeleteTarget(c) }}
                        title={t('common.delete')} aria-label={t('common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    {t('checkins.moodBefore')}: {c.moodBefore ? t(`checkins.moods.${c.moodBefore}`) : '—'} → {c.moodAfter ? t(`checkins.moods.${c.moodAfter}`) : '—'}
                    {' · '}{t('checkins.helpLevel')}: {c.helpLevel ? t(`checkins.helpLevels.${c.helpLevel}`) : '—'}
                  </p>
                  {c.safetyIncident && (
                    <p className="text-red-600 dark:text-red-400">⚠ {t('checkins.safetyIncidentReported')}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full evaluation details (double-click a history row) */}
      <Dialog open={detail !== null} onOpenChange={open => { if (!open) setDetail(null) }}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('checkins.detailsTitle')}</DialogTitle>
            {detail && (
              <DialogDescription>
                {t('checkins.weekOf', { date: new Date(detail.weekStartDate).toLocaleDateString(dateLocale) })}
              </DialogDescription>
            )}
          </DialogHeader>
          {detail && (
            <dl className="space-y-2.5 text-sm">
              <DetailRow label={t('checkins.moodBefore')} value={detail.moodBefore ? t(`checkins.moods.${detail.moodBefore}`) : null} fallback={t('checkins.notProvided')} />
              <DetailRow label={t('checkins.moodAfter')} value={detail.moodAfter ? t(`checkins.moods.${detail.moodAfter}`) : null} fallback={t('checkins.notProvided')} />
              <DetailRow label={t('checkins.helpLevel')} value={detail.helpLevel ? t(`checkins.helpLevels.${detail.helpLevel}`) : null} fallback={t('checkins.notProvided')} />
              <DetailRow label={t('checkins.performanceQuality')} value={detail.performanceQuality ? t(`checkins.qualities.${detail.performanceQuality}`) : null} fallback={t('checkins.notProvided')} />
              <DetailRow label={t('checkins.dayContext')} value={detail.dayContext ? t(`checkins.dayContexts.${detail.dayContext}`) : null} fallback={t('checkins.notProvided')} />
              {detail.dayContextNotes && <DetailRow label={t('checkins.dayContext') + ' — ' + t('checkins.notesLabel')} value={detail.dayContextNotes} fallback="" />}
              <DetailRow label={t('checkins.usesSkillOutsideApp')} value={detail.usesSkillOutsideApp ? t('common.yes') : t('common.no')} fallback="" />
              <DetailRow
                label={t('checkins.safetyIncident')}
                value={detail.safetyIncident ? t('common.yes') : t('common.no')}
                fallback=""
                emphasis={detail.safetyIncident}
              />
              {detail.safetyIncident && detail.safetyIncidentNotes && (
                <DetailRow label={t('checkins.safetyIncident') + ' — ' + t('checkins.notesLabel')} value={detail.safetyIncidentNotes} fallback="" />
              )}
              {detail.generalNotes && <DetailRow label={t('checkins.generalNotes')} value={detail.generalNotes} fallback="" />}
              <DetailRow
                label={t('checkins.recordedAt')}
                value={new Date(detail.createdAt).toLocaleString(dateLocale)}
                fallback=""
              />
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
        title={t('checkins.deleteTitle')}
        description={deleteTarget
          ? t('checkins.deleteConfirm', { date: new Date(deleteTarget.weekStartDate).toLocaleDateString(dateLocale) })
          : ''}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}

/** One label/value line in the evaluation details popup. */
function DetailRow({ label, value, fallback, emphasis }: { label: string; value: string | null; fallback: string; emphasis?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`text-right font-medium ${emphasis ? 'text-red-600 dark:text-red-400' : ''}`}>
        {value ?? fallback}
      </dd>
    </div>
  )
}
