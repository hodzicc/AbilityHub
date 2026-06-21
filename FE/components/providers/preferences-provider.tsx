'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { UIPreferences, NotificationSettings } from '@/lib/types'

interface PreferencesContextType {
  preferences: UIPreferences
  notifications: NotificationSettings
  updatePreferences: (prefs: Partial<UIPreferences>) => void
  updateNotifications: (notifs: Partial<NotificationSettings>) => void
  resetPreferences: () => void
}

const defaultPreferences: UIPreferences = {
  fontSize: 'medium',
  colorScheme: 'default',
  fontFamily: 'default',
  reducedMotion: false,
  highContrast: false,
  soundEnabled: true
}

const defaultNotifications: NotificationSettings = {
  dailyReport: true,
  weeklyReport: true,
  achievementAlerts: true,
  timeLimitAlerts: true
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  // Start from defaults so server HTML and the first client render match; the
  // stored values are applied right after mount (see effect) to avoid a
  // hydration mismatch.
  const [preferences, setPreferences] = useState<UIPreferences>(defaultPreferences)
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications)

  useEffect(() => {
    try {
      const storedPrefs = localStorage.getItem('abilityhub-preferences')
      if (storedPrefs) setPreferences({ ...defaultPreferences, ...JSON.parse(storedPrefs) })
      const storedNotifs = localStorage.getItem('abilityhub-notifications')
      if (storedNotifs) setNotifications({ ...defaultNotifications, ...JSON.parse(storedNotifs) })
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

  const updateNotifications = useCallback((notifs: Partial<NotificationSettings>) => {
    setNotifications(prev => {
      const updated = { ...prev, ...notifs }
      if (typeof window !== 'undefined') {
        localStorage.setItem('abilityhub-notifications', JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences)
    setNotifications(defaultNotifications)
    if (typeof window !== 'undefined') {
      localStorage.setItem('abilityhub-preferences', JSON.stringify(defaultPreferences))
      localStorage.setItem('abilityhub-notifications', JSON.stringify(defaultNotifications))
    }
  }, [])

  return (
    <PreferencesContext.Provider value={{
      preferences,
      notifications,
      updatePreferences,
      updateNotifications,
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

