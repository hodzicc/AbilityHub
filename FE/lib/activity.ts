import { Trophy, Play, CheckCircle, Pause, Loader2, type LucideIcon } from 'lucide-react'
import type { ActivityMetrics } from '@/lib/types'

export type ActivityAction = 'started' | 'completed' | 'paused' | 'achievement' | 'inProgress'

export const ACTIVITY_COLORS: Record<ActivityAction, string> = {
  started: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  achievement: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  inProgress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export const ACTIVITY_ICONS: Record<ActivityAction, LucideIcon> = {
  started: Play,
  completed: CheckCircle,
  paused: Pause,
  achievement: Trophy,
  inProgress: Loader2,
}

/** Maps a backend activity-type string (free-form) to one of the four UI action categories. */
export function activityTypeToAction(type: string): ActivityAction {
  const t = type.toLowerCase()
  if (t.includes('start') || t.includes('session')) return 'started'
  if (t.includes('achiev') || t.includes('badge') || t.includes('reward')) return 'achievement'
  if (t.includes('paus')) return 'paused'
  return 'completed'
}

/**
 * Resolves the UI action for an activity, honouring its live state: a still-running
 * activity is shown as "in progress" regardless of its type, so it isn't mislabelled
 * "Completed". Finished activities fall back to {@link activityTypeToAction}.
 */
export function resolveActivityAction(type: string, inProgress?: boolean): ActivityAction {
  return inProgress ? 'inProgress' : activityTypeToAction(type)
}

/**
 * A short, localized caption for an activity in a feed/list. Prefers deriving text
 * from the numeric metrics (locale-safe) over the raw `detail` field: apps used to
 * send `detail` as a pre-formatted Bosnian sentence (e.g. "Završeno 5 koraka..."),
 * which stays baked into old rows in whatever language it was written in regardless
 * of the reader's current locale — metrics-derived text is always in the current
 * locale, old rows included. `detail` is only used as a last resort, for activities
 * that predate metrics reporting entirely.
 */
export function describeActivity(
  activity: { detail?: string; name: string; inProgress?: boolean; metrics?: ActivityMetrics },
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  const m = activity.metrics
  if (activity.inProgress && m?.stepsTotal != null) {
    return t('dashboard.stepProgress', {
      completed: String(m.stepsCompleted ?? 0),
      total: String(m.stepsTotal),
    })
  }
  if (m?.stepsTotal != null) {
    return t('dashboard.activitySummary', {
      completed: String(m.stepsCompleted ?? 0),
      total: String(m.stepsTotal),
      hints: String(m.hintsShown ?? 0),
      errors: String(m.errorsCount ?? 0),
    })
  }
  return activity.detail || activity.name
}
