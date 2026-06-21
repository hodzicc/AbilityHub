'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Language } from '@/lib/types'
import { defaultLocale } from '@/lib/i18n/config'
import bsMessages from '@/lib/i18n/bs.json'
import enMessages from '@/lib/i18n/en.json'

type Messages = typeof bsMessages

interface LanguageContextType {
  locale: Language
  messages: Messages
  setLocale: (locale: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const messagesMap: Record<Language, Messages> = {
  bs: bsMessages,
  en: enMessages
}

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.')
  let current: unknown = obj
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[key]
  }
  
  return typeof current === 'string' ? current : undefined
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('abilityhub-locale') as Language | null
      return stored || defaultLocale
    }
    return defaultLocale
  })

  const messages = messagesMap[locale]

  const setLocale = useCallback((newLocale: Language) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('abilityhub-locale', newLocale)
    }
  }, [])

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(messages as unknown as Record<string, unknown>, key)
    
    if (!value) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Translation key not found: ${key}`)
      }
      return key
    }
    
    // Replace parameters like {name} with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value!.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue))
      })
    }
    
    return value
  }, [messages])

  return (
    <LanguageContext.Provider value={{ locale, messages, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export function useTranslation() {
  const { t, locale } = useLanguage()
  return { t, locale }
}

