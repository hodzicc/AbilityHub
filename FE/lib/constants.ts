// Backend role IDs (BE/.../Roles table). Centralized so adding/renaming a
// role only requires changing this file and the BE seed data, never the
// comparison logic scattered through pages and components.
export const ROLE_ID = {
  ADMIN: 1,
  PARENT: 2,
  CHILD: 3,
} as const

export type RoleId = typeof ROLE_ID[keyof typeof ROLE_ID]

// Single source of truth for application categories: value, default color,
// and i18n key. Adding a category means adding one entry here (plus the
// matching i18n string) instead of touching every page that lists categories.
import type { AppCategory } from '@/lib/types'

export const APP_CATEGORIES: { value: AppCategory; color: string; i18nKey: string }[] = [
  { value: 'education', color: '#4F46E5', i18nKey: 'applications.categories.education' },
  { value: 'speech',    color: '#8B5CF6', i18nKey: 'applications.categories.speech' },
  { value: 'motor',     color: '#EF4444', i18nKey: 'applications.categories.motor' },
  { value: 'daily',     color: '#F97316', i18nKey: 'applications.categories.daily' },
  { value: 'games',     color: '#10B981', i18nKey: 'applications.categories.games' },
]
