import { NextResponse } from 'next/server'
import { refreshTokens } from '@/lib/server/gateway'
import { clearSessionCookies, getAccessToken, getRefreshToken, setSessionCookies } from '@/lib/server/session'

/**
 * Hands the SignalR client an access token for the usage hub.
 *
 * A browser WebSocket cannot set an `Authorization` header, so SignalR appends the token
 * to the connection URL — which means the value has to be readable by page scripts. This
 * is the one place that is unavoidable, and it is deliberately narrow: the token is
 * fetched at connect time, lives only in the connection's memory, and is never written to
 * storage. Everything else goes through the proxy, where the token stays server-side.
 *
 * `/api/session/*` is reserved for the BFF itself and is not forwarded to the gateway.
 */

/** Seconds of remaining validity below which the token is refreshed before handing it out. */
const REFRESH_SKEW_SECONDS = 60

/** Reads `exp` out of a JWT without verifying it — the backend is the one that validates. */
function secondsUntilExpiry(token: string): number | null {
  const payload = token.split('.')[1]
  if (!payload) return null
  try {
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const exp = JSON.parse(json)?.exp
    return typeof exp === 'number' ? exp - Math.floor(Date.now() / 1000) : null
  } catch {
    return null
  }
}

export async function GET() {
  const token = await getAccessToken()
  const remaining = token ? secondsUntilExpiry(token) : null

  // Refresh up front when the token is missing or about to expire: a hub connection is
  // long-lived, and handing it a token that dies seconds later means a reconnect loop.
  if (!token || (remaining !== null && remaining < REFRESH_SKEW_SECONDS)) {
    const refreshToken = await getRefreshToken()
    const pair = refreshToken ? await refreshTokens(refreshToken) : null

    if (!pair) {
      await clearSessionCookies()
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await setSessionCookies(pair.accessToken, pair.refreshToken)
    return NextResponse.json({ token: pair.accessToken })
  }

  return NextResponse.json({ token })
}
