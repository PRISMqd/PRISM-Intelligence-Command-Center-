'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import PanelCard from '@/components/ui/PanelCard'
import EmptyState from '@/components/ui/EmptyState'
import type { PRISMAlert, AlertSeverity } from '@/lib/types'

const DISMISSED_KEY = 'prism_dismissed_alerts'

function getDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore
  }
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  if (severity === 'critical') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200 shrink-0">
        <AlertTriangle className="w-3 h-3" />
        Critical
      </span>
    )
  }
  if (severity === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
        <AlertTriangle className="w-3 h-3" />
        Warning
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
      <Info className="w-3 h-3" />
      Info
    </span>
  )
}

export default function AlertQueuePanel() {
  const [alerts, setAlerts] = useState<PRISMAlert[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setDismissed(getDismissed())
    fetch('/api/alerts')
      .then((r) => r.json())
      .then((data: PRISMAlert[]) => {
        const sorted = [...data].sort(
          (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
        )
        setAlerts(sorted)
      })
      .catch(() => {
        setAlerts([])
      })
      .finally(() => setLoading(false))
  }, [])

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      saveDismissed(next)
      return next
    })
  }

  const visible = alerts.filter(
    (a) => !dismissed.has(a.id) && a.dismissed_at == null
  )

  return (
    <PanelCard title="Alert Queue" description="Prioritized system alerts">
      {loading ? (
        <div className="py-8 text-center text-sm text-gray-400">Loading alerts...</div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-sm font-semibold text-gray-800">No active alerts</p>
            <p className="text-xs text-gray-500 mt-0.5">The system is clean.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
            >
              <SeverityBadge severity={alert.severity} />
              <p className="flex-1 text-sm text-gray-800 leading-snug min-w-0">
                {alert.alert_text}
              </p>
              <button
                onClick={() => dismiss(alert.id)}
                className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors mt-0.5"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  )
}
