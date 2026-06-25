// Central API client — all calls go through the Gateway at NEXT_PUBLIC_API_URL.

import { ROLE_ID } from '@/lib/constants'
import type { ActivityMetrics, WeeklyCheckIn } from '@/lib/types'

// API gateway base URL — read from the environment (.env.local: NEXT_PUBLIC_API_URL).
// Exported so other modules (e.g. the realtime hook) don't re-hardcode it.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5046'
const BASE = API_BASE_URL

// ---------- token helpers ----------

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('ah_access_token')
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('ah_refresh_token')
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('ah_access_token', access)
  localStorage.setItem('ah_refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('ah_access_token')
  localStorage.removeItem('ah_refresh_token')
}

// ---------- base fetch ----------

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  // Token refresh on 401
  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`
      const retry = await fetch(`${BASE}${path}`, { ...options, headers })
      if (!retry.ok) throw new ApiError(retry.status, await retry.text())
      return retry.status === 204 ? (undefined as T) : retry.json()
    }
    clearTokens()
    throw new ApiError(401, 'Unauthorized')
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new ApiError(res.status, body)
  }

  return res.status === 204 ? (undefined as T) : res.json()
}

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken()
  if (!rt) return false
  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    })
    if (!res.ok) return false
    const data: AuthResponse = await res.json()
    if (data.success) {
      setTokens(data.accessToken, data.refreshToken)
      return true
    }
  } catch {}
  return false
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// ---------- response types (mirrors BE DTOs) ----------

export interface AuthResponse {
  success: boolean
  accessToken: string
  refreshToken: string
  message: string
}

export interface UserProfileResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  roleId: number      // see ROLE_ID in lib/constants.ts
  isActive: boolean
  dateOfBirth?: string  // ISO date string
  gender?: string
  createdAt: string
}

export interface CreateUserResponse {
  success: boolean
  userId: string
  message: string
}

export interface ApplicationResponse {
  id: string
  key: string
  name: string
  platform: string
  version: string
  dataFormat: string
  description: string
  isActive: boolean
  category: string
  iconName: string
  color: string
  minAge: number
  maxAge: number
  featuresJson: string
}

export interface ChildApplicationResponse {
  applicationId: string
  key: string
  name: string
  assignedAt: string
}

export interface DashboardResponse {
  childId: string
  generatedAt: string
  // Inclusive first/last UTC day (ISO) of the usage window this dashboard covers —
  // backs the statistics page's range label and week-navigation bounds.
  rangeStart: string
  rangeEnd: string
  totalUsageMinutes: number
  activityCount: number
  // Real step-level progress (0–100) and 7-day routine consistency (0–1).
  // Null when no activity reported the underlying metrics yet.
  avgProgressPercent: number | null
  weeklyConsistency: number | null
  perApp: AppUsageDto[]
  recentActivities: RecentActivityDto[]
  recommendations: string[]
  // Distinct dates in the last 90 days with at least one completed activity —
  // backs the activity heatmap calendar.
  activeDays: string[]
  // Usage minutes per day for the last 7 days (oldest → newest, gaps filled with 0).
  dailyUsage: DailyUsageDto[]
}

export interface DailyUsageDto {
  date: string
  minutes: number
}

export interface DailyMetricsDay {
  date: string
  hints: number
  completed: number
  notCompleted: number
  stepBacks: number
}

export interface DailyMetricsResponse {
  childId: string
  rangeStart: string
  rangeEnd: string
  days: DailyMetricsDay[]
}

export interface AppUsageDto {
  applicationId: string
  sessionCount: number
  totalMinutes: number
  lastUsedAt: string | null
}

export interface RecentActivityDto {
  id: string
  applicationId: string
  activityType: string
  name: string
  score?: number
  occurredAt: string
  detail?: string
  // True while the child is still working through the activity (live step
  // progress); false/absent once it's finished.
  inProgress?: boolean
  // Accessibility metrics, embedded per activity. Undefined when the reporting
  // app sent none (frontend renders "Nije dostupno").
  metrics?: ActivityMetrics
}

export interface RestrictionResponse {
  dailyTimeLimitMinutes: number | null
  isBlocked: boolean
}

export interface LimitStatusResponse {
  childId: string
  applicationId: string
  isBlocked: boolean
  dailyLimitMinutes: number | null
  usedTodayMinutes: number
  remainingMinutes: number | null
  limitReached: boolean
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}

// ---------- Auth ----------

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data: AuthResponse = await res.json()
  if (!res.ok || !data.success) throw new ApiError(res.status, data.message)
  return data
}

export async function apiRegister(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName, lastName, roleId: ROLE_ID.PARENT }),
  })
  const data: AuthResponse = await res.json()
  if (!res.ok || !data.success) throw new ApiError(res.status, data.message ?? 'Registration failed')
  return data
}

export async function apiLogout(refreshToken: string): Promise<void> {
  await apiFetch('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {})
}

// ---------- Users ----------

export async function apiGetMe(): Promise<UserProfileResponse> {
  return apiFetch('/api/users/me')
}

export async function apiGetUser(id: string): Promise<UserProfileResponse> {
  return apiFetch(`/api/users/${id}`)
}

export async function apiGetAllUsers(page = 1, pageSize = 50): Promise<PagedResult<UserProfileResponse>> {
  return apiFetch(`/api/users?page=${page}&pageSize=${pageSize}`)
}

export async function apiUpdateProfile(
  id: string,
  data: { firstName: string; lastName: string; dateOfBirth?: string; gender?: string }
): Promise<UserProfileResponse> {
  return apiFetch(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function apiGetChildren(guardianId: string): Promise<UserProfileResponse[]> {
  return apiFetch(`/api/users/${guardianId}/children`)
}

export async function apiCreateUser(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  roleId: number
  guardianId?: string
  dateOfBirth?: string
  gender?: string
}): Promise<CreateUserResponse> {
  return apiFetch('/api/auth/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function apiDeactivateUser(id: string): Promise<void> {
  return apiFetch(`/api/auth/users/${id}`, { method: 'DELETE' })
}

export async function apiActivateUser(id: string): Promise<void> {
  return apiFetch(`/api/auth/users/${id}/activate`, { method: 'PUT' })
}

// ---------- Apps ----------

export async function apiGetApps(includeInactive = false): Promise<ApplicationResponse[]> {
  return apiFetch(`/api/apps${includeInactive ? '?includeInactive=true' : ''}`)
}

export async function apiGetApp(id: string): Promise<ApplicationResponse> {
  return apiFetch(`/api/apps/${id}`)
}

export async function apiGetChildApps(childId: string): Promise<ChildApplicationResponse[]> {
  return apiFetch(`/api/apps/children/${childId}`)
}

export async function apiAssignApp(childId: string, applicationId: string): Promise<void> {
  return apiFetch(`/api/apps/children/${childId}`, {
    method: 'POST',
    body: JSON.stringify({ applicationId }),
  })
}

export async function apiRemoveApp(childId: string, appId: string): Promise<void> {
  return apiFetch(`/api/apps/children/${childId}/${appId}`, { method: 'DELETE' })
}

export async function apiRegisterApp(data: {
  key: string
  name: string
  platform?: string
  version?: string
  dataFormat?: string
  description?: string
  category?: string
  iconName?: string
  color?: string
  minAge?: number
  maxAge?: number
  featuresJson?: string
}): Promise<ApplicationResponse> {
  return apiFetch('/api/apps', { method: 'POST', body: JSON.stringify(data) })
}

export async function apiUpdateApp(id: string, data: Partial<ApplicationResponse>): Promise<ApplicationResponse> {
  return apiFetch(`/api/apps/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function apiDeactivateApp(id: string): Promise<void> {
  return apiFetch(`/api/apps/${id}`, { method: 'DELETE' })
}

// ---------- Settings ----------

export async function apiGetPreferences(childId: string): Promise<Record<string, string>> {
  const res = await apiFetch<{ preferences: Record<string, string> }>(
    `/api/settings/children/${childId}/preferences`
  )
  return res.preferences ?? {}
}

export async function apiSetPreferences(childId: string, prefs: Record<string, string>): Promise<void> {
  return apiFetch(`/api/settings/children/${childId}/preferences`, {
    method: 'PUT',
    body: JSON.stringify({ preferences: prefs }),
  })
}

export async function apiGetRestriction(childId: string, appId: string): Promise<RestrictionResponse> {
  return apiFetch(`/api/settings/children/${childId}/apps/${appId}/restriction`)
}

export async function apiSetRestriction(
  childId: string,
  appId: string,
  data: { dailyTimeLimitMinutes: number | null; isBlocked: boolean }
): Promise<void> {
  return apiFetch(`/api/settings/children/${childId}/apps/${appId}/restriction`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// ---------- Usage ----------

/**
 * Dashboard for a child. Pass `applicationIds` to scope every figure (usage time,
 * recent activities, average progress, weekly consistency) to that set of apps —
 * this is how the statistics page's app-category filter is applied server-side.
 * Omit it for everything; pass an empty array to explicitly return nothing.
 */
export async function apiGetDashboard(
  childId: string,
  applicationIds?: string[],
  range?: { from: string; to: string },
): Promise<DashboardResponse> {
  const params = new URLSearchParams()
  if (applicationIds) params.set('applicationIds', applicationIds.join(','))
  if (range) { params.set('from', range.from); params.set('to', range.to) }
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiFetch(`/api/usage/children/${childId}/dashboard${query}`)
}

export async function apiGetLimitStatus(childId: string, appId: string): Promise<LimitStatusResponse> {
  return apiFetch(`/api/usage/children/${childId}/apps/${appId}/limit-status`)
}

export async function apiGetDailyMetrics(
  childId: string,
  applicationIds?: string[],
  range?: { from: string; to: string },
): Promise<DailyMetricsResponse> {
  const params = new URLSearchParams()
  if (applicationIds) params.set('applicationIds', applicationIds.join(','))
  if (range) { params.set('from', range.from); params.set('to', range.to) }
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiFetch(`/api/usage/children/${childId}/daily-metrics${query}`)
}

// ---------- Weekly parent check-ins ----------

export async function apiSubmitWeeklyCheckIn(
  data: Omit<WeeklyCheckIn, 'id' | 'createdAt'>
): Promise<WeeklyCheckIn> {
  // childId travels in the path; the rest of the object is the request body.
  return apiFetch(`/api/checkins/children/${data.childId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function apiGetWeeklyCheckIns(childId: string): Promise<WeeklyCheckIn[]> {
  return apiFetch(`/api/checkins/children/${childId}`)
}

export async function apiDeleteWeeklyCheckIn(childId: string, checkInId: string): Promise<void> {
  return apiFetch(`/api/checkins/children/${childId}/${checkInId}`, { method: 'DELETE' })
}

// ---------- QR child device pairing ----------

/** Issues a short-lived, single-use pairing token the mobile app exchanges for a session. */
export async function apiGetChildPairingToken(
  childId: string
): Promise<{ token: string; expiresAt: string }> {
  return apiFetch(`/api/auth/children/${childId}/pairing-token`, { method: 'POST' })
}

// ---------- Per-app Settings ----------

export async function apiGetAppPreferences(childId: string, appId: string): Promise<Record<string, string>> {
  const res = await apiFetch<{ preferences: Record<string, string> }>(
    `/api/settings/children/${childId}/apps/${appId}/preferences`
  )
  return res.preferences ?? {}
}

export async function apiSetAppPreferences(
  childId: string,
  appId: string,
  prefs: Record<string, string>
): Promise<void> {
  return apiFetch(`/api/settings/children/${childId}/apps/${appId}/preferences`, {
    method: 'PUT',
    body: JSON.stringify({ preferences: prefs }),
  })
}


/** Removes all per-app preference overrides — the app falls back to the child's global preferences. */
export async function apiClearAppPreferences(childId: string, appId: string): Promise<void> {
  return apiFetch(`/api/settings/children/${childId}/apps/${appId}/preferences`, { method: 'DELETE' })
}
