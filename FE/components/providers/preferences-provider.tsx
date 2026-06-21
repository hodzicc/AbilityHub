'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
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
  const [preferences, setPreferences] = useState<UIPreferences>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('abilityhub-preferences')
      return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences
    }
    return defaultPreferences
  })

  const [notifications, setNotifications] = useState<NotificationSettings>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('abilityhub-notifications')
      return stored ? JSON.parse(stored) : defaultNotifications
    }
    return defaultNotifications
  })

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

