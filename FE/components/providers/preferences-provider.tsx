'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { UIPreferences } from '@/lib/types'
import { DEFAULT_PREFERENCES } from '@/lib/preferences'

interface PreferencesContextType {
  preferences: UIPreferences
  updatePreferences: (prefs: Partial<UIPreferences>) => void
  resetPreferences: () => void
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  // Start from defaults so server HTML and the first client render match; the
  // stored values are applied right after mount (see effect) to avoid a
  // hydration mismatch.
  const [preferences, setPreferences] = useState<UIPreferences>(DEFAULT_PREFERENCES)

  useEffect(() => {
    try {
      const storedPrefs = localStorage.getItem('abilityhub-preferences')
      if (storedPrefs) setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(storedPrefs) })
    } catch {
      // Ignore malformed stored values; defaults remain in effect.
    }
  }, [])

  const updatePreferences = useCallback((prefs: Partial<UIPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...prefs }
      if (typeof window !== 'undefined') {
        localStorage.setItem('abilityhub-preferences', JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES)
    if (typeof window !== 'undefined') {
      localStorage.setItem('abilityhub-preferences', JSON.stringify(DEFAULT_PREFERENCES))
    }
  }, [])

  return (
    <PreferencesContext.Provider value={{
      preferences,
      updatePreferences,
      resetPreferences
    }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}
