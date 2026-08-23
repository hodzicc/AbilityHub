import 'server-only'
import { GATEWAY_URL } from './session'

/**
 * Shared gateway helpers for the BFF route handlers.
 */

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

interface GatewayAuthResponse {
  success: boolean
  accessToken: string
  refreshToken: string
  message: string
}

/**
 * Exchanges a refresh token for a fresh pair.
 *
 * Refresh tokens rotate: the Auth service revokes the presented token before issuing a new
 * one, so the same token can only ever be redeemed once. Pages here routinely fire requests
 * in parallel (a `Promise.all` over every child, for instance), and when the access token
 * expires they all get a 401 at once while still carrying the same now-stale cookie — so
 * without coordination all but one of them would redeem an already-revoked token and the
 * guardian would be signed out mid-task.
 *
 * Sharing only the in-flight promise is not enough. A request that arrives just after the
 * exchange completed still carries the old cookie (the browser sent it before the new one
 * was set), finds no exchange running, and starts a second one with the revoked token. The
 * resolved pair is therefore also cached briefly against the old token, so those late
 * arrivals are handed the pair that was already obtained for them.
 */
const inFlight = new Map<string, Promise<TokenPair | null>>()
const recentlyRotated = new Map<string, { pair: TokenPair; expiresAt: number }>()

/** How long a completed exchange keeps answering for the token it replaced. */
const ROTATION_GRACE_MS = 30_000

export function refreshTokens(refreshToken: string): Promise<TokenPair | null> {
  const inProgress = inFlight.get(refreshToken)
  if (inProgress) return inProgress

  const settled = recentlyRotated.get(refreshToken)
  if (settled) {
    if (settled.expiresAt > Date.now()) return Promise.resolve(settled.pair)
    recentlyRotated.delete(refreshToken)
  }

  const pending = doRefresh(refreshToken)
    .then(pair => {
      if (pair) {
        pruneRotated()
        recentlyRotated.set(refreshToken, { pair, expiresAt: Date.now() + ROTATION_GRACE_MS })
      }
      return pair
    })
    .finally(() => {
      inFlight.delete(refreshToken)
    })

  inFlight.set(refreshToken, pending)
  return pending
}

/** Drops expired grace entries so the map can't grow without bound in a long-lived process. */
function pruneRotated() {
  const now = Date.now()
  for (const [token, entry] of recentlyRotated) {
    if (entry.expiresAt <= now) recentlyRotated.delete(token)
  }
}

async function doRefresh(refreshToken: string): Promise<TokenPair | null> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = (await res.json()) as GatewayAuthResponse
    if (!data.success || !data.accessToken) return null
    return { accessToken: data.accessToken, refreshToken: data.refreshToken }
  } catch {
    return null
  }
}

/** Forwards a request to the gateway with an optional bearer token. */
export function callGateway(
  path: string,
  init: { method: string; body?: string | null; contentType?: string | null; accessToken?: string },
): Promise<Response> {
  const headers: Record<string, string> = {}
  if (init.contentType) headers['Content-Type'] = init.contentType
  if (init.accessToken) headers['Authorization'] = `Bearer ${init.accessToken}`

  return fetch(`${GATEWAY_URL}${path}`, {
    method: init.method,
    headers,
    body: init.body ?? undefined,
    cache: 'no-store',
  })
}
