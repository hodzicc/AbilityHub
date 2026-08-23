import { NextResponse } from 'next/server'
import { callGateway } from '@/lib/server/gateway'
import { setSessionCookies } from '@/lib/server/session'

/**
 * Sign-in. The gateway hands back both tokens in the response body; this handler moves
 * them into HttpOnly cookies and deliberately does NOT pass them on to the browser, so
 * the page bundle never holds a credential it could leak.
 */
export async function POST(request: Request) {
  const body = await request.text()

  const res = await callGateway('/api/auth/login', {
    method: 'POST',
    body,
    contentType: 'application/json',
  })

  const data = await res.json().catch(() => null)

  if (!res.ok || !data?.success) {
    return NextResponse.json(
      { success: false, message: data?.message ?? 'Unauthorized' },
      { status: res.status === 200 ? 401 : res.status },
    )
  }

  await setSessionCookies(data.accessToken, data.refreshToken)
  return NextResponse.json({ success: true, message: data.message ?? '' })
}
