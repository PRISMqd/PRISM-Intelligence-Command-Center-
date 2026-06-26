'use client'

import { useEffect } from 'react'
import { createRealtimeSubscription } from '@/lib/realtime'
import { useObjectsStore } from '@/store/objects'
import { useClaimsStore } from '@/store/claims'
import { useTasksStore } from '@/store/tasks'
import { useAlertsStore } from '@/store/alerts'
import { useMetricsStore } from '@/store/metrics'
import { useBriefsStore } from '@/store/briefs'
import { useRisksStore } from '@/store/risks'
import { useAssumptionsStore } from '@/store/assumptions'
import { useUnknownsStore } from '@/store/unknowns'

interface RealtimeProviderProps {
  children: React.ReactNode
}

export default function RealtimeProvider({ children }: RealtimeProviderProps) {
  const addObject = useObjectsStore((s) => s.addObject)
  const updateObject = useObjectsStore((s) => s.updateObject)
  const removeObject = useObjectsStore((s) => s.removeObject)

  const addClaim = useClaimsStore((s) => s.addClaim)
  const updateClaim = useClaimsStore((s) => s.updateClaim)
  const removeClaim = useClaimsStore((s) => s.removeClaim)

  const addAssumption = useAssumptionsStore((s) => s.addAssumption)
  const updateAssumption = useAssumptionsStore((s) => s.updateAssumption)
  const removeAssumption = useAssumptionsStore((s) => s.removeAssumption)

  const addUnknown = useUnknownsStore((s) => s.addUnknown)
  const updateUnknown = useUnknownsStore((s) => s.updateUnknown)
  const removeUnknown = useUnknownsStore((s) => s.removeUnknown)

  const addTask = useTasksStore((s) => s.addTask)
  const updateTask = useTasksStore((s) => s.updateTask)
  const removeTask = useTasksStore((s) => s.removeTask)

  const addRisk = useRisksStore((s) => s.addRisk)
  const updateRisk = useRisksStore((s) => s.updateRisk)
  const removeRisk = useRisksStore((s) => s.removeRisk)

  const addAlert = useAlertsStore((s) => s.addAlert)

  const setMetric = useMetricsStore((s) => s.setMetric)
  const setRai = useMetricsStore((s) => s.setRai)

  const setBrief = useBriefsStore((s) => s.setBrief)

  useEffect(() => {
    const unsubscribers: Array<() => void> = []

    // objects
    unsubscribers.push(
      createRealtimeSubscription('prism:objects', 'objects', (event) => {
        if (event.eventType === 'INSERT') addObject(event.new)
        else if (event.eventType === 'UPDATE') updateObject(event.new.id, event.new)
        else if (event.eventType === 'DELETE') removeObject(event.old.id)
      })
    )

    // claims
    unsubscribers.push(
      createRealtimeSubscription('prism:claims', 'claims', (event) => {
        if (event.eventType === 'INSERT') addClaim(event.new)
        else if (event.eventType === 'UPDATE') updateClaim(event.new.id, event.new)
        else if (event.eventType === 'DELETE') removeClaim(event.old.id)
      })
    )

    // evidence — no dedicated store; surface as alerts when stale
    unsubscribers.push(
      createRealtimeSubscription('prism:evidence', 'evidence', (event) => {
        if (event.eventType === 'INSERT') {
          const rec = event.new as any
          const staleThreshold = Date.now() - 30 * 24 * 60 * 60 * 1000
          const lastVerified = rec.last_verified_at
            ? new Date(rec.last_verified_at).getTime()
            : 0
          if (lastVerified < staleThreshold) {
            addAlert({
              id: `evidence-stale-${rec.id}`,
              type: 'stale_evidence',
              message: `Evidence item ${rec.id} has not been verified in 30+ days`,
              severity: 'warning',
              createdAt: new Date().toISOString(),
            })
          }
        }
      })
    )

    // assumptions
    unsubscribers.push(
      createRealtimeSubscription('prism:assumptions', 'assumptions', (event) => {
        if (event.eventType === 'INSERT') addAssumption(event.new)
        else if (event.eventType === 'UPDATE') updateAssumption(event.new.id, event.new)
        else if (event.eventType === 'DELETE') removeAssumption(event.old.id)
      })
    )

    // unknowns
    unsubscribers.push(
      createRealtimeSubscription('prism:unknowns', 'unknowns', (event) => {
        if (event.eventType === 'INSERT') addUnknown(event.new)
        else if (event.eventType === 'UPDATE') updateUnknown(event.new.id, event.new)
        else if (event.eventType === 'DELETE') removeUnknown(event.old.id)
      })
    )

    // decisions — no dedicated store; surface as alerts for open decisions
    unsubscribers.push(
      createRealtimeSubscription('prism:decisions', 'decisions', (event) => {
        if (event.eventType === 'INSERT') {
          const rec = event.new as any
          const openStatuses = ['OPEN', 'PENDING', 'IN_REVIEW']
          if (openStatuses.includes(rec.status)) {
            addAlert({
              id: `decision-open-${rec.id}`,
              type: 'open_decision',
              message: `New decision requires review: ${rec.title ?? rec.id}`,
              severity: 'info',
              createdAt: new Date().toISOString(),
            })
          }
        }
      })
    )

    // tasks
    unsubscribers.push(
      createRealtimeSubscription('prism:tasks', 'tasks', (event) => {
        if (event.eventType === 'INSERT') addTask(event.new)
        else if (event.eventType === 'UPDATE') updateTask(event.new.id, event.new)
        else if (event.eventType === 'DELETE') removeTask(event.old.id)
      })
    )

    // metrics
    unsubscribers.push(
      createRealtimeSubscription('prism:metrics', 'metrics', (event) => {
        if (event.eventType === 'INSERT' || event.eventType === 'UPDATE') {
          const rec = event.new as any
          if (rec.metric_type === 'rai') {
            setRai(rec.value ?? null)
          } else {
            setMetric(rec.metric_type ?? rec.id, rec)
          }
        }
      })
    )

    // briefs
    unsubscribers.push(
      createRealtimeSubscription('prism:briefs', 'briefs', (event) => {
        if (event.eventType === 'INSERT' || event.eventType === 'UPDATE') {
          setBrief(event.new)
        }
      })
    )

    // risks
    unsubscribers.push(
      createRealtimeSubscription('prism:risks', 'risks', (event) => {
        if (event.eventType === 'INSERT') addRisk(event.new)
        else if (event.eventType === 'UPDATE') updateRisk(event.new.id, event.new)
        else if (event.eventType === 'DELETE') removeRisk(event.old.id)
      })
    )

    // provenance_events — surface inserts as informational alerts
    unsubscribers.push(
      createRealtimeSubscription('prism:provenance_events', 'provenance_events', (event) => {
        if (event.eventType === 'INSERT') {
          const rec = event.new as any
          addAlert({
            id: `provenance-${rec.id}`,
            type: 'provenance_event',
            message: `Provenance event recorded: ${rec.event_type ?? rec.id}`,
            severity: 'info',
            createdAt: new Date().toISOString(),
          })
        }
      })
    )

    // contradictions — surface as high-severity alerts
    unsubscribers.push(
      createRealtimeSubscription('prism:contradictions', 'contradictions', (event) => {
        if (event.eventType === 'INSERT') {
          const rec = event.new as any
          addAlert({
            id: `contradiction-${rec.id}`,
            type: 'contradiction',
            message: `Contradiction detected: ${rec.description ?? rec.id}`,
            severity: 'critical',
            createdAt: new Date().toISOString(),
          })
        }
      })
    )

    return () => {
      for (const unsub of unsubscribers) {
        unsub()
      }
    }
  }, [
    addObject, updateObject, removeObject,
    addClaim, updateClaim, removeClaim,
    addAssumption, updateAssumption, removeAssumption,
    addUnknown, updateUnknown, removeUnknown,
    addTask, updateTask, removeTask,
    addRisk, updateRisk, removeRisk,
    addAlert,
    setMetric, setRai,
    setBrief,
  ])

  return <>{children}</>
}
