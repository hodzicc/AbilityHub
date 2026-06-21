// Mock implementations for endpoints the backend does not yet expose.
// Every function here is documented in BE/API_CONTRACTS_NEEDED.md with the
// real route/shape the backend developer should implement. Once a real
// endpoint exists, delete the corresponding mock and point the caller at
// the real `apiFetch`-based client in lib/api/index.ts — call sites are
// written so that swap requires no other changes.

import type { ActivityMetrics, WeeklyCheckIn } from '@/lib/types'

// ---------- per-activity accessibility metrics (mock) ----------
// Real contract: GET /api/usage/children/{childId}/apps/{appId}/activities/{activityId}/metrics
// Deterministic "random" derived from the activity id so the same activity
// always renders the same demo numbers across reloads.
function seededRandom(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return (h % 1000) / 1000
}

export async function apiGetActivityMetrics(activityId: string): Promise<ActivityMetrics> {
  const r = seededRandom(activityId)
  const stepsTotal = 3 + Math.floor(r * 5)
  const stepsCompleted = Math.max(1, Math.round(stepsTotal * (0.4 + r * 0.6)))
  return {
    startedViaAction: r > 0.1,
    completedViaAction: stepsCompleted === stepsTotal && r > 0.3,
    stepsCompleted,
    stepsTotal,
    durationSeconds: 30 + Math.floor(r * 600),
    hintsShown: Math.floor(r * 4),
    errorsCount: Math.floor(r * 3),
  }
}

// ---------- child device pairing (QR login) (mock) ----------
// Real contract: POST /api/auth/children/{childId}/pairing-token
// Issues a short-lived, single-use token the mobile app exchanges for a
// session; here we just fabricate a token string with the same shape.
export async function apiGetChildPairingToken(childId: string): Promise<{ token: string; expiresAt: string }> {
  const token = `mock.${childId}.${Date.now()}`
  const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString()
  return { token, expiresAt }
}

// ---------- weekly parent check-ins (mock, localStorage-backed) ----------
// Real contract: POST/GET /api/checkins/children/{childId}
// Backed by localStorage today so the form is fully usable in demos and
// survives reloads; swap for real fetch calls once the endpoint exists.
const CHECKINS_KEY = 'abilityhub-weekly-checkins'

function readAllCheckIns(): WeeklyCheckIn[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CHECKINS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeAllCheckIns(items: WeeklyCheckIn[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(items))
}

export async function apiSubmitWeeklyCheckIn(
  data: Omit<WeeklyCheckIn, 'id' | 'createdAt'>
): Promise<WeeklyCheckIn> {
  const checkIn: WeeklyCheckIn = {
    ...data,
    id: `${data.childId}-${data.weekStartDate}`,
    createdAt: new Date().toISOString(),
  }
  const items = readAllCheckIns().filter(c => c.id !== checkIn.id)
  items.push(checkIn)
  writeAllCheckIns(items)
  return checkIn
}

export async function apiGetWeeklyCheckIns(childId: string): Promise<WeeklyCheckIn[]> {
  return readAllCheckIns()
    .filter(c => c.childId === childId)
    .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate))
}
