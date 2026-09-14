// Central API client. Calls go to same-origin `/api/*`, which the Next.js route handlers
// (the BFF layer in app/api/) forward to the gateway after attaching the access token from
// an HttpOnly cookie. Nothing in this module ever sees a token: authentication, refresh and
// sign-out all happen server-side.

import { ROLE_ID } from '@/lib/constants'
import type { ActivityMetrics, WeeklyCheckIn } from '@/lib/types'

// Direct gateway address, still needed for the SignalR hub: a WebSocket cannot be proxied
// through a route handler, so the realtime connection talks to the gateway itself and gets
// its token from /api/session/realtime-token.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5046'

// ---------- base fetch ----------

/**
 * Same-origin request to the BFF. The proxy adds the bearer token, refreshes it on 401 and
 * retries once, so callers only ever see the final outcome.
 */
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  const res = await fetch(path, { ...options, headers })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new ApiError(res.status, body)
  }

  return res.status === 204 ? (undefined as T) : res.json()
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// ---------- response types (mirrors BE DTOs) ----------

/**
 * What the BFF returns for sign-in and registration. The tokens themselves stay on the
 * server, in HttpOnly cookies — deliberately absent from this shape.
 */
export interface AuthResponse {
  success: boolean
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
  /** When this guardian dismissed the introductory guide; absent until they have. */
  helpGuideSeenAt?: string
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
  recommendations: RecommendationDto[]
  // Distinct dates in the last 90 days with at least one completed activity —
  // backs the activity heatmap calendar.
  activeDays: string[]
  // Usage minutes per day for the last 7 days (oldest → newest, gaps filled with 0).
  dailyUsage: DailyUsageDto[]
}

/// A recommendation as a type + params, translated client-side (the backend has no
/// notion of the caller's locale) — see `children.recommendations.*` in the i18n files.
export interface RecommendationDto {
  type: string
  params: Record<string, string>
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
  childId: string
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

export interface AggregateDashboardResponse {
  generatedAt: string
  activeChildrenCount: number
  totalUsageMinutesToday: number
  avgProgressPercent: number | null
  dailyUsage: DailyUsageDto[]
  recentActivities: RecentActivityDto[]
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

export interface UserSummaryResponse {
  totalUsers: number
  adminCount: number
  parentCount: number
  childCount: number
  childCountsByGuardian: Record<string, number>
}

// ---------- Auth ----------

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
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
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName, lastName, roleId: ROLE_ID.PARENT }),
  })
  const data: AuthResponse = await res.json()
  if (!res.ok || !data.success) throw new ApiError(res.status, data.message ?? 'Registration failed')
  return data
}

/** Revokes the refresh token and clears the session cookies. The token itself is read server-side. */
export async function apiLogout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
}

// ---------- Users ----------

export async function apiGetMe(): Promise<UserProfileResponse> {
  return apiFetch('/api/users/me')
}

export async function apiGetUser(id: string): Promise<UserProfileResponse> {
  return apiFetch(`/api/users/${id}`)
}

// The directory returns active users only by default; pass includeInactive to also get
// deactivated accounts (the admin management view, which can reactivate them).
export async function apiGetAllUsers(
  page = 1, pageSize = 50, search?: string, roleId?: number, includeInactive = false,
): Promise<PagedResult<UserProfileResponse>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (search) params.set('search', search)
  if (roleId !== undefined) params.set('roleId', String(roleId))
  if (includeInactive) params.set('includeInactive', 'true')
  return apiFetch(`/api/users?${params.toString()}`)
}

/**
 * The full user directory (optionally filtered by role), fetched a page at a time
 * until every row has been retrieved — for the rare, deliberate cases that
 * genuinely need everyone (e.g. resolving names for an admin-wide activity feed),
 * as opposed to a single bounded page that silently drops rows past the cap.
 */
export async function apiGetAllUsersUnpaged(roleId?: number, includeInactive = false): Promise<UserProfileResponse[]> {
  const pageSize = 100
  const all: UserProfileResponse[] = []
  let page = 1
  while (true) {
    const res = await apiGetAllUsers(page, pageSize, undefined, roleId, includeInactive)
    all.push(...res.items)
    if (all.length >= res.totalCount || res.items.length === 0) break
    page++
  }
  return all
}

/**
 * Role counts + per-guardian child counts across the whole user directory, computed
 * on the backend in one pass — not derived from a (possibly partial) loaded page.
 */
export async function apiGetUserSummary(): Promise<UserSummaryResponse> {
  return apiFetch('/api/users/summary')
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

/**
 * Records that the signed-in guardian has read the introductory guide. Stored on their
 * profile rather than in browser storage, so the guide does not reappear on another device.
 */
export async function apiMarkHelpGuideSeen(): Promise<UserProfileResponse> {
  return apiFetch('/api/users/me/help-guide-seen', { method: 'PUT' })
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

export interface AppAssignmentResponse {
  childId: string
  assignedAt: string
}

/**
 * Every child assignment of a given app, across the whole platform (admin only) —
 * one call instead of checking each child's own assignment list to see who has it.
 */
export async function apiGetAppAssignments(applicationId: string): Promise<AppAssignmentResponse[]> {
  return apiFetch(`/api/apps/${applicationId}/assignments`)
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

/**
 * Aggregate usage snapshot for the signed-in user's own scope, computed by the
 * backend in one call — not one dashboard call per child. An admin gets every child
 * on the platform; a parent gets their own children combined. Role decides the scope
 * server-side, so both use this single endpoint.
 */
export async function apiGetAggregateDashboard(): Promise<AggregateDashboardResponse> {
  return apiFetch('/api/usage/dashboard')
}

/**
 * Average step-completion progress per child across the caller's scope (admin: every
 * child; parent: their own), computed by the backend in one call. Only children with
 * reported step activity appear — default the rest to 0. Lets a list view show a
 * progress figure per child without fetching a full dashboard each.
 */
export async function apiGetChildrenProgress(): Promise<{ childId: string; avgProgressPercent: number }[]> {
  return apiFetch('/api/usage/progress')
}

export async function apiGetLimitStatus(childId: string, appId: string): Promise<LimitStatusResponse> {
  return apiFetch(`/api/usage/children/${childId}/apps/${appId}/limit-status`)
}

// ---- Combined statistics over several children at once (the "All children" view) ----
// The backend sums/merges across the given children in one query — same response shapes
// as the per-child routes — instead of the client fetching one per child and combining.
// Children are always narrowed server-side to those the caller may see.

function combinedQuery(childIds: string[], applicationIds?: string[], extra?: Record<string, string>): string {
  const params = new URLSearchParams({ childIds: childIds.join(','), ...extra })
  if (applicationIds) params.set('applicationIds', applicationIds.join(','))
  return params.toString()
}

export async function apiGetCombinedDashboard(
  childIds: string[], applicationIds?: string[], range?: { from: string; to: string },
): Promise<DashboardResponse> {
  return apiFetch(`/api/usage/combined/dashboard?${combinedQuery(childIds, applicationIds, range)}`)
}

export async function apiGetCombinedDailyMetrics(
  childIds: string[], applicationIds?: string[], range?: { from: string; to: string },
): Promise<DailyMetricsResponse> {
  return apiFetch(`/api/usage/combined/daily-metrics?${combinedQuery(childIds, applicationIds, range)}`)
}

export async function apiGetCombinedCalendarMonth(
  childIds: string[], year: number, month: number, applicationIds?: string[],
): Promise<CalendarMonthResponse> {
  return apiFetch(`/api/usage/combined/calendar?${combinedQuery(childIds, applicationIds, { year: String(year), month: String(month) })}`)
}

export async function apiGetCombinedActivitiesOnDate(
  childIds: string[], date: string, applicationIds?: string[],
): Promise<RecentActivityDto[]> {
  return apiFetch(`/api/usage/combined/activities-on-date?${combinedQuery(childIds, applicationIds, { date })}`)
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

export interface CalendarMonthResponse {
  childId: string
  year: number
  month: number
  activeDays: string[]
}

/** Which days in a given month have any activity — backs the statistics calendar's month grid. */
export async function apiGetCalendarMonth(
  childId: string,
  year: number,
  month: number,
  applicationIds?: string[],
): Promise<CalendarMonthResponse> {
  const params = new URLSearchParams({ year: String(year), month: String(month) })
  if (applicationIds) params.set('applicationIds', applicationIds.join(','))
  return apiFetch(`/api/usage/children/${childId}/calendar?${params.toString()}`)
}

/** Every activity a child had on one specific day — backs the calendar's day drill-down. */
export async function apiGetActivitiesOnDate(
  childId: string,
  date: string,
  applicationIds?: string[],
): Promise<RecentActivityDto[]> {
  const params = new URLSearchParams({ date })
  if (applicationIds) params.set('applicationIds', applicationIds.join(','))
  return apiFetch(`/api/usage/children/${childId}/activities-on-date?${params.toString()}`)
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

/**
 * Of the signed-in guardian's own children, the ids that still have no check-in for
 * the given week (Monday, ISO date). Computed by the backend in one call so the
 * dashboard reminder doesn't fetch every child's check-ins and diff them client-side.
 */
export async function apiGetPendingCheckIns(weekStart: string): Promise<string[]> {
  return apiFetch(`/api/checkins/pending?weekStart=${weekStart}`)
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
