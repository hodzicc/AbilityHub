import { Trophy, Play, CheckCircle, Pause, type LucideIcon } from 'lucide-react'

export type ActivityAction = 'started' | 'completed' | 'paused' | 'achievement'

export const ACTIVITY_COLORS: Record<ActivityAction, string> = {
  started: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  achievement: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

export const ACTIVITY_ICONS: Record<ActivityAction, LucideIcon> = {
  started: Play,
  completed: CheckCircle,
  paused: Pause,
  achievement: Trophy,
}

/** Maps a backend activity-type string (free-form) to one of the four UI action categories. */
export function activityTypeToAction(type: string): ActivityAction {
  const t = type.toLowerCase()
  if (t.includes('start') || t.includes('session')) return 'started'
  if (t.includes('achiev') || t.includes('badge') || t.includes('reward')) return 'achievement'
  if (t.includes('paus')) return 'paused'
  return 'completed'
}
