// Central API client — all calls go through the Gateway at NEXT_PUBLIC_API_URL.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5046'

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
  roleId: number      // 1=Admin 2=Parent 3=Child
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
  totalUsageMinutes: number
  activityCount: number
  perApp: AppUsageDto[]
  recentActivities: RecentActivityDto[]
  recommendations: string[]
}

export interface AppUsageDto {
  applicationId: string
  sessionCount: number
  totalMinutes: number
  lastUsedAt: string | null
}

export interface RecentActivityDto {
  applicationId: string
  activityType: string
  name: string
  score?: number
  occurredAt: string
  detail?: string
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

export interface ResolvedSettingsResponse {
  childId: string
  applicationId: string
  preferences: Record<string, string>
  restriction: RestrictionResponse
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
    body: JSON.stringify({ email, password, firstName, lastName, roleId: 2 }),
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
}): Promise<CreateUserResponse> {
  return apiFetch('/api/auth/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function apiDeactivateUser(id: string): Promise<void> {
  return apiFetch(`/api/auth/users/${id}`, { method: 'DELETE' })
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

export async function apiGetDashboard(childId: string): Promise<DashboardResponse> {
  return apiFetch(`/api/usage/children/${childId}/dashboard`)
}

export async function apiGetLimitStatus(childId: string, appId: string): Promise<LimitStatusResponse> {
  return apiFetch(`/api/usage/children/${childId}/apps/${appId}/limit-status`)
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

export async function apiGetResolvedSettings(
  childId: string,
  appId: string
): Promise<ResolvedSettingsResponse> {
  return apiFetch(`/api/settings/children/${childId}/apps/${appId}/resolved`)
}
