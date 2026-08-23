import 'server-only'
import { cookies } from 'next/headers'

/**
 * Server-side session storage for the BFF layer.
 *
 * Tokens live in HttpOnly cookies that only the Next.js route handlers can read, so a
 * cross-site scripting bug in the browser bundle cannot walk off with a session the way
 * it could when these values sat in localStorage. Because the browser now talks to
 * same-origin `/api/*` routes, `SameSite=Lax` is enough — there is no cross-site request
 * to accommodate, and therefore no need for `SameSite=None; Secure` (and the HTTPS
 * requirement that comes with it) in development.
 *
 * The backend is unchanged: it still returns both tokens in the response body, which is
 * what the Flutter app and the reference web app continue to consume.
 */

export const ACCESS_COOKIE = 'ah_at'
export const REFRESH_COOKIE = 'ah_rt'

// Mirrors the backend lifetimes (Jwt:AccessTokenMinutes defaults to 480; refresh tokens
// are issued with a 7-day expiry). The cookie outliving its token is harmless — the proxy
// refreshes on 401 — but a cookie that dies first would log the user out early.
const ACCESS_MAX_AGE = 8 * 60 * 60
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60

/** The API gateway the BFF forwards to. Server-only: never exposed to the browser bundle. */
export const GATEWAY_URL =
  process.env.API_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5046'

const baseCookie = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value
}

export async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_COOKIE)?.value
}

export async function setSessionCookies(accessToken: string, refreshToken: string) {
  const jar = await cookies()
  jar.set(ACCESS_COOKIE, accessToken, { ...baseCookie, maxAge: ACCESS_MAX_AGE })
  jar.set(REFRESH_COOKIE, refreshToken, { ...baseCookie, maxAge: REFRESH_MAX_AGE })
}

export async function clearSessionCookies() {
  const jar = await cookies()
  jar.delete(ACCESS_COOKIE)
  jar.delete(REFRESH_COOKIE)
}
