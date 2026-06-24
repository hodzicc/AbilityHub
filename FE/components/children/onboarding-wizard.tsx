'use client'

import { useState } from 'react'
import { useTranslation, useAuth } from '@/components/providers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PreferenceFields } from '@/components/preferences'
import { AddChildDialog } from './add-child-dialog'
import { AssignAppsDialog } from './assign-apps-dialog'
import { apiCreateUser, apiGetChildren, apiSetPreferences, type UserProfileResponse } from '@/lib/api'
import { DEFAULT_PREFERENCES, prefsToRecord } from '@/lib/preferences'
import { ROLE_ID } from '@/lib/constants'
import type { UIPreferences, Gender } from '@/lib/types'
import { PartyPopper, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface OnboardingWizardProps {
  open: boolean
  onClose: () => void
  /** Called once the wizard finishes (or is dismissed past step 1) so the caller can refresh its child list. */
  onFinished: () => Promise<void> | void
}

const TOTAL_STEPS = 3

/**
 * First-run flow for a brand-new parent: add their first child, assign a first
 * app, and set accessibility preferences — three steps that already exist as
 * standalone dialogs/forms elsewhere, sequenced here instead of leaving a new
 * parent on an empty dashboard with no guidance.
 */
export function OnboardingWizard({ open, onClose, onFinished }: OnboardingWizardProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [childId, setChildId] = useState<string | null>(null)
  const [childName, setChildName] = useState('')
  const [preferences, setPreferences] = useState<UIPreferences>(DEFAULT_PREFERENCES)
  const [savingPrefs, setSavingPrefs] = useState(false)

  const reset = () => {
    setStep(0)
    setChildId(null)
    setChildName('')
    setPreferences(DEFAULT_PREFERENCES)
  }

  const closeWizard = () => {
    reset()
    onClose()
  }

  const handleAddChild = async (childData: { firstName: string; lastName: string; dateOfBirth: Date; gender: Gender }) => {
    if (!user) return
    const email = `child-${Date.now()}@internal.abilityhub.app`
    const password = Math.random().toString(36).slice(-12) + 'Aa1!'
    const result = await apiCreateUser({
      email,
      password,
      firstName: childData.firstName,
      lastName: childData.lastName,
      roleId: ROLE_ID.CHILD,
      dateOfBirth: childData.dateOfBirth.toISOString(),
      gender: childData.gender,
    })
    if (!result.success) {
      toast.error(t('children.createError'))
      return
    }
    // The profile + guardian link are built asynchronously from an event —
    // briefly poll until it appears (same read-after-write pattern as the
    // children list page) before moving to the next step.
    let profile: UserProfileResponse | undefined
    for (let attempt = 0; attempt < 6; attempt++) {
      const profiles = await apiGetChildren(user.id)
      profile = profiles.find(p => p.id === result.userId)
      if (profile) break
      await new Promise(r => setTimeout(r, 500))
    }
    if (!profile) {
      toast.error(t('children.loadError'))
      return
    }
    setChildId(profile.id)
    setChildName(`${profile.firstName} ${profile.lastName}`.trim())
    toast.success(t('children.addSuccess'))
    setStep(2)
  }

  const handleSavePreferences = async () => {
    if (!childId) return
    setSavingPrefs(true)
    try {
      await apiSetPreferences(childId, prefsToRecord(preferences))
      toast.success(t('onboarding.complete'))
      await onFinished()
      closeWizard()
    } catch {
      toast.error(t('settings.savePreferencesError'))
    } finally {
      setSavingPrefs(false)
    }
  }

  if (!open) return null

  return (
    <>
      {step > 0 && (
        <div className="fixed inset-x-0 top-4 z-[60] flex justify-center">
          <div className="rounded-full border bg-background px-4 py-1.5 text-xs font-medium shadow-md">
            {t('onboarding.stepIndicator', { step: String(step), total: String(TOTAL_STEPS) })}
          </div>
        </div>
      )}

      {/* Step 0: welcome */}
      <Dialog open={step === 0} onOpenChange={(isOpen) => { if (!isOpen) closeWizard() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <DialogTitle>{t('onboarding.welcomeTitle')}</DialogTitle>
            <DialogDescription>{t('onboarding.welcomeDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={closeWizard}>{t('onboarding.skip')}</Button>
            <Button onClick={() => setStep(1)}>{t('onboarding.start')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 1: add first child */}
      <AddChildDialog
        open={step === 1}
        onOpenChange={(isOpen) => { if (!isOpen && !childId) closeWizard() }}
        onAdd={handleAddChild}
      />

      {/* Step 2: assign first app */}
      <AssignAppsDialog
        open={step === 2}
        onOpenChange={(isOpen) => { if (!isOpen) setStep(3) }}
        childId={childId ?? ''}
        childName={childName}
        assignedAppIds={[]}
        onAssigned={() => {}}
      />

      {/* Step 3: accessibility preferences */}
      <Dialog open={step === 3} onOpenChange={(isOpen) => { if (!isOpen) closeWizard() }}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('onboarding.preferencesTitle', { name: childName })}</DialogTitle>
            <DialogDescription>{t('onboarding.preferencesDesc')}</DialogDescription>
          </DialogHeader>
          <PreferenceFields value={preferences} onChange={setPreferences} idPrefix="onboarding" />
          <DialogFooter>
            <Button variant="outline" onClick={closeWizard} disabled={savingPrefs}>
              {t('onboarding.skip')}
            </Button>
            <Button onClick={handleSavePreferences} disabled={savingPrefs}>
              {savingPrefs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <PartyPopper className="mr-2 h-4 w-4" />
              {t('onboarding.finish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
