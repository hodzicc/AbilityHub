import { NextResponse } from 'next/server'
import { callGateway } from '@/lib/server/gateway'
import { setSessionCookies } from '@/lib/server/session'

/**
 * Registration. Same contract as sign-in: the tokens the gateway returns are stored as
 * HttpOnly cookies and never handed to the browser.
 */
export async function POST(request: Request) {
  const body = await request.text()

  const res = await callGateway('/api/auth/register', {
    method: 'POST',
    body,
    contentType: 'application/json',
  })

  const data = await res.json().catch(() => null)

  if (!res.ok || !data?.success) {
    return NextResponse.json(
      { success: false, message: data?.message ?? 'Registration failed' },
      { status: res.status === 200 ? 400 : res.status },
    )
  }

  await setSessionCookies(data.accessToken, data.refreshToken)
  return NextResponse.json({ success: true, message: data.message ?? '' })
}
