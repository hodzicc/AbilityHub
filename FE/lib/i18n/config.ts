import type { Language } from '@/lib/types'

export const defaultLocale: Language = 'bs'
export const locales: Language[] = ['bs', 'en']

export const localeNames: Record<Language, string> = {
  bs: 'Bosanski',
  en: 'English'
}

export const localeFlags: Record<Language, string> = {
  bs: '🇧🇦',
  en: '🇬🇧'
}
