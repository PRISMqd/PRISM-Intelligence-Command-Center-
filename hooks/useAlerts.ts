'use client'

import { useState, useEffect } from 'react'
import type { PRISMAlert } from '@/lib/types'

const DISMISSED_ALERTS_KEY = 'prism:dismissed_alert_ids'

function getDismissedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(DISMISSED_ALERTS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

interface UseAlertsResult {
  alerts: PRISMAlert[]
  criticalCount: number
  warningCount: number
  loading: boolean
}

export function useAlerts(): UseAlertsResult {
  const [alerts, setAlerts] = useState<PRISMAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch('/api/alerts')
        if (!res.ok) throw new Error(`/api/alerts responded with ${res.status}`)
        const data: PRISMAlert[] = await res.json()

        if (!cancelled) {
          const dismissedIds = getDismissedIds()
          const visible = data.filter(
            (alert) => !dismissedIds.has(alert.id) && alert.dismissed_at === null
          )
          setAlerts(visible)
          setLoading(false)
        }
      } catch (err) {
        console.error('[useAlerts] fetch error:', err)
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    const interval = setInterval(load, 30_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const warningCount = alerts.filter((a) => a.severity === 'warning').length

  return { alerts, criticalCount, warningCount, loading }
}
