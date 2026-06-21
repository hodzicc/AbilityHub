'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from '@/components/providers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, QrCode, RefreshCw } from 'lucide-react'
import { apiGetChildPairingToken } from '@/lib/api/mocks'

/**
 * QR pairing code so the child can log in to the mobile app by scanning
 * instead of typing credentials. Backed by a mock token today — see
 * BE/API_CONTRACTS_NEEDED.md for the real pairing-token endpoint the
 * backend should implement; this component swaps over with no UI changes.
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
