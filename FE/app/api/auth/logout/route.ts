import { NextResponse } from 'next/server'
import { callGateway } from '@/lib/server/gateway'
import { clearSessionCookies, getRefreshToken } from '@/lib/server/session'

/**
 * Sign-out. Revokes the refresh token server-side, then clears the cookies. The browser
 * never needs to know the token value to end its own session.
 */
export async function POST() {
  const refreshToken = await getRefreshToken()

  if (refreshToken) {
    // Best effort: a gateway that is down must not leave the user stuck in a session
    // they have already asked to end, so the cookies are cleared either way.
    await callGateway('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      contentType: 'application/json',
    }).catch(() => null)
  }

  await clearSessionCookies()
  return NextResponse.json({ success: true })
}
