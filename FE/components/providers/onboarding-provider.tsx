'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useAuth } from './auth-provider'
import { HelpGuide } from '@/components/onboarding'
import { apiMarkHelpGuideSeen } from '@/lib/api'

interface OnboardingContextType {
  /** Open the illustrated help guide on demand (e.g. from the header Help button). */
  openWizard: () => void
}

const OnboardingContext = createContext<OnboardingContextType>({ openWizard: () => {} })

export const useOnboarding = () => useContext(OnboardingContext)

/**
 * Hosts the illustrated help guide once for the whole dashboard so it can be (a)
 * auto-shown to a brand-new guardian on first sign-in and (b) re-opened any time via the
 * header Help button. The guide only explains the app — it performs no actions.
 *
 * Whether it has already been seen is part of the guardian's profile on the server, not
 * browser storage: the same person signing in from a second device or browser should not
 * be walked through the introduction again. The flag arrives with the profile that is
 * fetched on every sign-in, so reading it costs no extra request.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  // Set once the guide has been dismissed in this session, so the auto-open effect does
  // not fire again before the profile is re-fetched.
  const [dismissed, setDismissed] = useState(false)
  // Guards against auto-opening twice for the same account — React mounts components
  // twice in development, and the server round-trip below is not instant.
  const autoOpenedFor = useRef<string | null>(null)

  const openWizard = useCallback(() => setOpen(true), [])

  const closeWizard = useCallback(() => {
    setOpen(false)
    setDismissed(true)
    // Recorded on close rather than on open: a guide marked as read before the guardian
    // has actually seen it would silently never appear again. Best effort — failing to
    // persist the flag only means the guide shows once more, which is harmless.
    void apiMarkHelpGuideSeen().catch(() => {})
  }, [])

  // First run: auto-open once for a guardian who has not dismissed it yet. Admins are
  // skipped — the guide describes the guardian workflow.
  useEffect(() => {
    if (!user || user.role !== 'parent') return
    if (user.helpGuideSeenAt || dismissed) return
    if (autoOpenedFor.current === user.id) return
    autoOpenedFor.current = user.id
    setOpen(true)
  }, [user, dismissed])

  return (
    <OnboardingContext.Provider value={{ openWizard }}>
      {children}
      <HelpGuide open={open} onClose={closeWizard} />
    </OnboardingContext.Provider>
  )
}
