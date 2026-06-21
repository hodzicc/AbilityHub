'use client'

// Minimal realtime hook: subscribes to the Usage SignalR hub and calls `onChanged`
// whenever a watched child reports usage (time, an activity, or live step
// progress). The push is a content-free ping — the caller re-fetches the
// authoritative dashboard over the normal authorized REST endpoint.

import { useEffect, useRef } from 'react'
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr'
import { getAccessToken, API_BASE_URL } from '@/lib/api'

const BASE = API_BASE_URL

export function useUsageRealtime(childIds: string[], onChanged: (childId: string) => void) {
  // Keep the latest callback without forcing a reconnect when it changes.
  const onChangedRef = useRef(onChanged)
  onChangedRef.current = onChanged

  // Reconnect only when the *set* of watched children changes.
  const key = [...childIds].sort().join(',')

  useEffect(() => {
    if (!key) return
    const ids = key.split(',')
    let cancelled = false

    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(`${BASE}/hubs/usage`, { accessTokenFactory: () => getAccessToken() ?? '' })
      .withAutomaticReconnect()
      .build()

    connection.on('usageChanged', (payload: { childId: string }) => {
      if (payload?.childId) onChangedRef.current(payload.childId)
    })

    const watchAll = async () => {
      for (const id of ids) {
        try {
          await connection.invoke('WatchChild', id)
        } catch {
          /* best-effort */
        }
      }
    }

    // Re-subscribe after an automatic reconnect.
    connection.onreconnected(() => void watchAll())

    connection
      .start()
      .then(() => {
        if (!cancelled) return watchAll()
      })
      .catch(() => {
        /* realtime is best-effort; the page still works without it */
      })

    return () => {
      cancelled = true
      connection.stop().catch(() => {})
    }
  }, [key])
}
