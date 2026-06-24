'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useAuth } from './auth-provider'
import { HelpGuide } from '@/components/onboarding'

interface OnboardingContextType {
  /** Open the illustrated help guide on demand (e.g. from the header Help button). */
  openWizard: () => void
}

const OnboardingContext = createContext<OnboardingContextType>({ openWizard: () => {} })

export const useOnboarding = () => useContext(OnboardingContext)

/**
 * Hosts the illustrated help guide once for the whole dashboard so it can be (a)
 * auto-shown to a brand-new parent on first login and (b) re-opened any time via
 * the header Help button. The "already seen" flag is per-user in localStorage, so
 * it auto-opens exactly once per parent account but the Help button always works.
 * The guide only explains the app — it performs no actions.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const seenKey = user ? `abilityhub_onboarding_seen_${user.id}` : null

  const openWizard = useCallback(() => setOpen(true), [])

  const markSeen = useCallback(() => {
    if (seenKey && typeof window !== 'undefined') localStorage.setItem(seenKey, '1')
  }, [seenKey])

  const closeWizard = useCallback(() => {
    markSeen()
    setOpen(false)
  }, [markSeen])

  // First-run: auto-open once for a parent who hasn't seen it yet. The "seen" flag
  // is written on close (not here), so React StrictMode's double-mount in dev can't
  // mark it seen before the wizard ever shows.
  useEffect(() => {
    if (!user || user.role !== 'parent' || !seenKey) return
    if (typeof window !== 'undefined' && !localStorage.getItem(seenKey)) {
      setOpen(true)
    }
  }, [user?.id, user?.role, seenKey])

  return (
    <OnboardingContext.Provider value={{ openWizard }}>
      {children}
      <HelpGuide open={open} onClose={closeWizard} />
    </OnboardingContext.Provider>
  )
}
