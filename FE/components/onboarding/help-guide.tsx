'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useTranslation } from '@/components/providers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Heart,
  Sparkles,
  Home,
  Users,
  AppWindow,
  BarChart3,
  Palette,
  MousePointerClick,
  Plus,
  QrCode,
  Smartphone,
  Check,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'

interface HelpGuideProps {
  open: boolean
  onClose: () => void
}

/* ----------------------------- illustrations ----------------------------- */

/** A faux sidebar with one nav row highlighted + a click cursor — "go here". */
function NavMock({ activeIndex }: { activeIndex: number }) {
  const rows = [
    { icon: Home, label: 'nav.dashboard', color: 'text-indigo-400' },
    { icon: Users, label: 'nav.children', color: 'text-orange-400' },
    { icon: AppWindow, label: 'nav.applications', color: 'text-amber-400' },
    { icon: BarChart3, label: 'nav.statistics', color: 'text-emerald-400' },
    { icon: Palette, label: 'nav.preferences', color: 'text-pink-400' },
  ]
  const { t } = useTranslation()
  return (
    <div className="relative w-44 rounded-xl border bg-muted/40 p-2 shadow-sm">
      {rows.map((r, i) => {
        const active = i === activeIndex
        return (
          <div
            key={r.label}
            className={cn(
              'flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
              active ? 'bg-primary/15 text-foreground ring-2 ring-primary' : 'text-muted-foreground'
            )}
          >
            <r.icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : r.color)} />
            <span className="truncate">{t(r.label)}</span>
            {active && <MousePointerClick className="ml-auto h-4 w-4 text-primary animate-pulse" />}
          </div>
        )
      })}
    </div>
  )
}

/** A faux primary button being clicked. */
function ButtonMock({ label, icon: Icon = Plus }: { label: string; icon?: typeof Plus }) {
  return (
    <div className="relative inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-md">
      <Icon className="h-4 w-4" />
      {label}
      <MousePointerClick className="absolute -bottom-3 -right-3 h-5 w-5 text-primary drop-shadow animate-pulse" />
    </div>
  )
}

function StepFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center gap-4 rounded-xl bg-gradient-to-br from-muted/60 to-muted/20 p-5">
      {children}
    </div>
  )
}

/* -------------------------------- content -------------------------------- */

function useSteps(t: (k: string, v?: Record<string, string>) => string) {
  return [
    {
      key: 'welcome',
      illustration: (
        <StepFrame>
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg shadow-indigo-500/30">
            <Heart className="h-9 w-9 text-white" />
            <Sparkles className="absolute -right-2 -top-2 h-6 w-6 text-amber-400" />
          </div>
        </StepFrame>
      ),
      title: t('guide.welcomeTitle'),
      desc: t('guide.welcomeDesc'),
    },
    {
      key: 'children',
      illustration: (
        <StepFrame>
          <NavMock activeIndex={1} />
          <ArrowRight className="h-6 w-6 shrink-0 text-muted-foreground" />
          <ButtonMock label={t('children.addChild')} />
        </StepFrame>
      ),
      title: t('guide.childrenTitle'),
      desc: t('guide.childrenDesc'),
    },
    {
      key: 'apps',
      illustration: (
        <StepFrame>
          <NavMock activeIndex={2} />
          <ArrowRight className="h-6 w-6 shrink-0 text-muted-foreground" />
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {['bg-indigo-400', 'bg-amber-400', 'bg-emerald-400'].map(c => (
                <div key={c} className={cn('flex h-10 w-10 items-center justify-center rounded-xl text-white', c)}>
                  <AppWindow className="h-5 w-5" />
                </div>
              ))}
            </div>
            <ButtonMock label={t('children.assignApps')} />
          </div>
        </StepFrame>
      ),
      title: t('guide.appsTitle'),
      desc: t('guide.appsDesc'),
    },
    {
      key: 'preferences',
      illustration: (
        <StepFrame>
          <NavMock activeIndex={4} />
          <ArrowRight className="h-6 w-6 shrink-0 text-muted-foreground" />
          <div className="w-40 space-y-2 rounded-xl border bg-background p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold" style={{ fontSize: 16 }}>Aa</span>
              <span className="text-muted-foreground">{t('settings.fontSize')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('settings.highContrast')}</span>
              <div className="flex h-4 w-7 items-center rounded-full bg-primary px-0.5">
                <div className="ml-auto h-3 w-3 rounded-full bg-white" />
              </div>
            </div>
            <div className="flex gap-1.5">
              {['bg-indigo-500', 'bg-pink-400', 'bg-amber-400'].map(c => (
                <div key={c} className={cn('h-5 w-5 rounded-full ring-2 ring-offset-1', c)} />
              ))}
            </div>
          </div>
        </StepFrame>
      ),
      title: t('guide.preferencesTitle'),
      desc: t('guide.preferencesDesc'),
    },
    {
      key: 'qr',
      illustration: (
        <StepFrame>
          <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed bg-background">
            <QrCode className="h-12 w-12 text-foreground" />
          </div>
          <ArrowRight className="h-6 w-6 shrink-0 text-muted-foreground" />
          <div className="relative flex h-24 w-14 items-center justify-center rounded-xl border-4 border-foreground/80 bg-background">
            <Smartphone className="h-7 w-7 text-foreground" />
            <Check className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-emerald-500 p-1 text-white" />
          </div>
        </StepFrame>
      ),
      title: t('guide.qrTitle'),
      desc: t('guide.qrDesc'),
    },
    {
      key: 'statistics',
      illustration: (
        <StepFrame>
          <NavMock activeIndex={3} />
          <ArrowRight className="h-6 w-6 shrink-0 text-muted-foreground" />
          <div className="flex h-20 items-end gap-1.5 rounded-xl border bg-background p-3 shadow-sm">
            {[10, 18, 8, 24, 16, 28].map((h, i) => (
              <div key={i} className="w-3 rounded-t bg-emerald-400" style={{ height: h }} />
            ))}
            <BarChart3 className="ml-1 h-6 w-6 self-center text-emerald-500" />
          </div>
        </StepFrame>
      ),
      title: t('guide.statisticsTitle'),
      desc: t('guide.statisticsDesc'),
    },
  ]
}

/* -------------------------------- component ------------------------------- */

/**
 * Purely informational, illustrated walkthrough of how a parent uses AbilityHub
 * (where to click, what each page does). Unlike the old action wizard it creates
 * nothing — it just teaches. Shown once automatically to new parents and re-openable
 * any time from the header Help button.
 */
export function HelpGuide({ open, onClose }: HelpGuideProps) {
  const { t } = useTranslation()
  const steps = useSteps(t)
  const [step, setStep] = useState(0)
  const total = steps.length
  const isLast = step === total - 1

  // Always restart from the first slide when reopened.
  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  const current = steps[step]

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.desc}</DialogDescription>
        </DialogHeader>

        {current.illustration}

        {/* progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {steps.map((s, i) => (
            <button
              key={s.key}
              aria-label={`${i + 1}`}
              onClick={() => setStep(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === step ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60'
              )}
            />
          ))}
        </div>

        <DialogFooter className="sm:justify-between">
          {step === 0 ? (
            <Button variant="ghost" onClick={onClose}>{t('guide.skip')}</Button>
          ) : (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {t('guide.back')}
            </Button>
          )}
          {isLast ? (
            <Button onClick={onClose}>
              <Check className="mr-1.5 h-4 w-4" />
              {t('guide.done')}
            </Button>
          ) : (
            <Button onClick={() => setStep(s => s + 1)}>
              {t('guide.next')}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
