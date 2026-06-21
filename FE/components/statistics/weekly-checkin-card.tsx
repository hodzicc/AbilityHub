'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from '@/components/providers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { DayContext, HelpLevel, Mood, PerformanceQuality, WeeklyCheckIn } from '@/lib/types'
import { apiGetWeeklyCheckIns, apiSubmitWeeklyCheckIn } from '@/lib/api'

const MOOD_VALUES: Mood[] = ['great', 'good', 'neutral', 'difficult', 'hard']
const HELP_LEVEL_VALUES: HelpLevel[] = ['none', 'minimal', 'moderate', 'extensive']
const QUALITY_VALUES: PerformanceQuality[] = ['excellent', 'good', 'partial', 'poor']
const DAY_CONTEXT_VALUES: DayContext[] = ['normal', 'poor-sleep', 'illness', 'routine-change', 'stress', 'other']

/** Monday (ISO date) of the current week. */
function currentWeekStart(): string {
  const d = new Date()
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

export function WeeklyCheckInCard({ childId, childName }: { childId: string; childName: string }) {
  const { t, locale } = useTranslation()
  const weekStartDate = currentWeekStart()
  const [history, setHistory] = useState<WeeklyCheckIn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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

  useEffect(() => {
    setIsLoading(true)
    apiGetWeeklyCheckIns(childId)
      .then(items => {
        setHistory(items)
        const thisWeek = items.find(i => i.weekStartDate === weekStartDate)
        if (thisWeek) {
          setMoodBefore(thisWeek.moodBefore ?? '')
          setMoodAfter(thisWeek.moodAfter ?? '')
          setHelpLevel(thisWeek.helpLevel ?? '')
          setPerformanceQuality(thisWeek.performanceQuality ?? '')
          setSafetyIncident(thisWeek.safetyIncident)
          setSafetyIncidentNotes(thisWeek.safetyIncidentNotes ?? '')
          setDayContext(thisWeek.dayContext ?? '')
          setDayContextNotes(thisWeek.dayContextNotes ?? '')
          setUsesSkillOutsideApp(thisWeek.usesSkillOutsideApp ?? false)
          setGeneralNotes(thisWeek.generalNotes ?? '')
        }
      })
      .finally(() => setIsLoading(false))
  }, [childId, weekStartDate])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const saved = await apiSubmitWeeklyCheckIn({
        childId,
        weekStartDate,
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
      setHistory(prev => [saved, ...prev.filter(c => c.id !== saved.id)])
      toast.success(t('checkins.saveSuccess'))
    } catch {
      toast.error(t('checkins.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="h-48 bg-muted animate-pulse rounded-lg" />

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('checkins.title')} — {childName}</CardTitle>
          <CardDescription>
            {t('checkins.subtitle', { date: new Date(weekStartDate).toLocaleDateString(dateLocale) })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('checkins.moodBefore')}</Label>
              <Select value={moodBefore} onValueChange={v => setMoodBefore(v as Mood)}>
                <SelectTrigger><SelectValue placeholder={t('checkins.selectPlaceholder')} /></SelectTrigger>
                <SelectContent>{MOOD_VALUES.map(m => <SelectItem key={m} value={m}>{t(`checkins.moods.${m}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('checkins.moodAfter')}</Label>
              <Select value={moodAfter} onValueChange={v => setMoodAfter(v as Mood)}>
                <SelectTrigger><SelectValue placeholder={t('checkins.selectPlaceholder')} /></SelectTrigger>
                <SelectContent>{MOOD_VALUES.map(m => <SelectItem key={m} value={m}>{t(`checkins.moods.${m}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t('checkins.helpLevel')}</Label>
            <Select value={helpLevel} onValueChange={v => setHelpLevel(v as HelpLevel)}>
              <SelectTrigger><SelectValue placeholder={t('checkins.selectPlaceholder')} /></SelectTrigger>
              <SelectContent>{HELP_LEVEL_VALUES.map(h => <SelectItem key={h} value={h}>{t(`checkins.helpLevels.${h}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t('checkins.performanceQuality')}</Label>
            <Select value={performanceQuality} onValueChange={v => setPerformanceQuality(v as PerformanceQuality)}>
              <SelectTrigger><SelectValue placeholder={t('checkins.selectPlaceholder')} /></SelectTrigger>
              <SelectContent>{QUALITY_VALUES.map(q => <SelectItem key={q} value={q}>{t(`checkins.qualities.${q}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('checkins.safetyIncident')}</Label>
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

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>{t('checkins.usesSkillOutsideApp')}</Label>
            <Switch checked={usesSkillOutsideApp} onCheckedChange={setUsesSkillOutsideApp} />
          </div>

          <div className="space-y-1.5">
            <Label>{t('checkins.generalNotes')}</Label>
            <Textarea value={generalNotes} onChange={e => setGeneralNotes(e.target.value)} rows={3} />
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t('checkins.save')}
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
              {history.map(c => (
                <div key={c.id} className="rounded-lg border p-3 text-sm space-y-1">
                  <p className="font-medium">
                    {t('checkins.weekOf', { date: new Date(c.weekStartDate).toLocaleDateString(dateLocale) })}
                  </p>
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
    </div>
  )
}
