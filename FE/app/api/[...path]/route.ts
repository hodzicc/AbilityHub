import { NextResponse } from 'next/server'
import { callGateway, refreshTokens } from '@/lib/server/gateway'
import { clearSessionCookies, getAccessToken, getRefreshToken, setSessionCookies } from '@/lib/server/session'

/**
 * BFF proxy for every backend call that isn't sign-in, registration or sign-out (those
 * have their own handlers, which take precedence over this catch-all).
 *
 * The browser calls same-origin `/api/...`; this handler reads the access token from the
 * HttpOnly cookie, attaches it as a bearer token and forwards to the gateway. On a 401 it
 * refreshes once and retries, so an expired access token is invisible to the caller —
 * the same behaviour the browser client used to implement, now somewhere the token itself
 * is never exposed to page scripts.
 */

type Ctx = { params: Promise<{ path: string[] }> }

async function proxy(request: Request, ctx: Ctx): Promise<Response> {
  const { path } = await ctx.params
  const search = new URL(request.url).search
  const target = `/api/${path.join('/')}${search}`

  const method = request.method
  const contentType = request.headers.get('content-type')
  // Read the body once — a Request body is a stream and cannot be replayed on retry.
  const body = method === 'GET' || method === 'HEAD' ? null : await request.text()

  let accessToken = await getAccessToken()
  let res = await callGateway(target, { method, body, contentType, accessToken })

  if (res.status === 401) {
    const refreshToken = await getRefreshToken()
    const pair = refreshToken ? await refreshTokens(refreshToken) : null

    if (!pair) {
      await clearSessionCookies()
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await setSessionCookies(pair.accessToken, pair.refreshToken)
    accessToken = pair.accessToken
    res = await callGateway(target, { method, body, contentType, accessToken })
  }

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  // Pass the payload through untouched so the client keeps parsing exactly what the
  // backend produced, including error bodies.
  const payload = await res.text()
  return new NextResponse(payload, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
