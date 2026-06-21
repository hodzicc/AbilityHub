'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from '@/components/providers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, QrCode, RefreshCw } from 'lucide-react'
import { apiGetChildPairingToken } from '@/lib/api'

/**
 * QR pairing code so the child can log in to the mobile app by scanning
 * instead of typing credentials. The platform issues a short-lived, single-use
 * token (POST /api/auth/children/{childId}/pairing-token); the mobile app scans
 * the QR (which encodes { childId, token }) and exchanges it for a session.
 */
export function QrPairingCard({ childId, childName }: { childId: string; childName: string }) {
  const { t, locale } = useTranslation()
  const [payload, setPayload] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = async () => {
    setIsLoading(true)
    try {
      const { token, expiresAt } = await apiGetChildPairingToken(childId)
      setPayload(JSON.stringify({ type: 'abilityhub-pairing', childId, token }))
      setExpiresAt(expiresAt)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId])

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-indigo-500" />
          {t('qrPairing.title')}
        </CardTitle>
        <CardDescription>
          {t('qrPairing.description', { name: childName })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="rounded-2xl border bg-white p-4">
          {isLoading || !payload ? (
            <div className="flex h-[180px] w-[180px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <QRCodeSVG value={payload} size={180} />
          )}
        </div>
        {expiresAt && (
          <p className="text-xs text-muted-foreground">
            {t('qrPairing.expiresAt', { time: new Date(expiresAt).toLocaleTimeString(locale === 'bs' ? 'bs-BA' : 'en-US') })}
          </p>
        )}
        <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          {t('qrPairing.regenerate')}
        </Button>
      </CardContent>
    </Card>
  )
}
