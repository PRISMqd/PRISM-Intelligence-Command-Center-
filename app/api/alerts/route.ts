import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export interface PRISMAlert {
  id: string
  type:
    | 'overdue_task'
    | 'high_risk_assumption'
    | 'unsupported_claim'
    | 'stale_evidence'
    | 'high_evi_unknown'
    | 'open_contradiction'
    | 'blocked_decision'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  object_id: string
  object_type: string
  meta?: Record<string, unknown>
}

export async function GET(_request: NextRequest) {
  try {
    const client = await createServerSupabaseClient()
    const alerts: PRISMAlert[] = []
    const now = new Date()

    // 1. Overdue tasks
    const { data: overdueTasks, error: overdueError } = await client
      .from('tasks')
      .select('id, title, due_date, priority, status')
      .lt('due_date', now.toISOString())
      .not('status', 'in', '("DONE","CANCELLED")')

    if (overdueError) console.warn('[alerts] overdue tasks query failed:', overdueError)
    for (const task of overdueTasks ?? []) {
      alerts.push({
        id: `overdue_task_${task.id}`,
        type: 'overdue_task',
        severity: task.priority === 'CRITICAL' ? 'critical' : task.priority === 'HIGH' ? 'high' : 'medium',
        title: `Overdue task: ${task.title}`,
        object_id: task.id,
        object_type: 'task',
        meta: { due_date: task.due_date, status: task.status, priority: task.priority },
      })
    }

    // 2. High-risk assumptions
    const { data: riskyAssumptions, error: assumptionsError } = await client
      .from('assumptions')
      .select('id, title, assumption_risk_score, status')
      .gt('assumption_risk_score', 0.7)
      .eq('status', 'active')

    if (assumptionsError) console.warn('[alerts] high-risk assumptions query failed:', assumptionsError)
    for (const assumption of riskyAssumptions ?? []) {
      alerts.push({
        id: `high_risk_assumption_${assumption.id}`,
        type: 'high_risk_assumption',
        severity: (assumption.assumption_risk_score ?? 0) > 0.9 ? 'critical' : 'high',
        title: `High-risk assumption: ${assumption.title}`,
        object_id: assumption.id,
        object_type: 'assumption',
        meta: { assumption_risk_score: assumption.assumption_risk_score },
      })
    }

    // 3. Unsupported claims
    const { data: unsupportedClaims, error: claimsError } = await client
      .from('claims')
      .select('id, title, status')
      .eq('status', 'unsupported')

    if (claimsError) console.warn('[alerts] unsupported claims query failed:', claimsError)
    for (const claim of unsupportedClaims ?? []) {
      alerts.push({
        id: `unsupported_claim_${claim.id}`,
        type: 'unsupported_claim',
        severity: 'medium',
        title: `Unsupported claim: ${claim.title}`,
        object_id: claim.id,
        object_type: 'claim',
        meta: { status: claim.status },
      })
    }

    // 4. Stale evidence (no verification in 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: staleEvidence, error: evidenceError } = await client
      .from('evidence')
      .select('id, title, last_verified_at, collected_at')
      .or(
        `last_verified_at.lt.${thirtyDaysAgo},and(last_verified_at.is.null,collected_at.lt.${thirtyDaysAgo})`
      )

    if (evidenceError) console.warn('[alerts] stale evidence query failed:', evidenceError)
    for (const ev of staleEvidence ?? []) {
      alerts.push({
        id: `stale_evidence_${ev.id}`,
        type: 'stale_evidence',
        severity: 'low',
        title: `Stale evidence: ${ev.title}`,
        object_id: ev.id,
        object_type: 'evidence',
        meta: { last_verified_at: ev.last_verified_at, collected_at: ev.collected_at },
      })
    }

    // 5. High-EVI unknowns
    const { data: highEviUnknowns, error: unknownsError } = await client
      .from('unknowns')
      .select('id, title, evi_score, status')
      .gt('evi_score', 0.5)
      .eq('status', 'open')

    if (unknownsError) console.warn('[alerts] high-EVI unknowns query failed:', unknownsError)
    for (const unknown of highEviUnknowns ?? []) {
      alerts.push({
        id: `high_evi_unknown_${unknown.id}`,
        type: 'high_evi_unknown',
        severity: (unknown.evi_score ?? 0) > 0.8 ? 'high' : 'medium',
        title: `High-EVI unknown: ${unknown.title}`,
        object_id: unknown.id,
        object_type: 'unknown',
        meta: { evi_score: unknown.evi_score },
      })
    }

    // 6. Open contradictions
    const { data: openContradictions, error: contradictionsError } = await client
      .from('contradictions')
      .select('id, title, status')
      .eq('status', 'active')

    if (contradictionsError) console.warn('[alerts] open contradictions query failed:', contradictionsError)
    for (const contradiction of openContradictions ?? []) {
      alerts.push({
        id: `open_contradiction_${contradiction.id}`,
        type: 'open_contradiction',
        severity: 'high',
        title: `Open contradiction: ${contradiction.title}`,
        object_id: contradiction.id,
        object_type: 'contradiction',
        meta: { status: contradiction.status },
      })
    }

    // 7. Blocked decisions (stuck in early stages for 14+ days)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const { data: blockedDecisions, error: decisionsError } = await client
      .from('decisions')
      .select('id, title, status, updated_at')
      .in('status', ['FRAMING', 'IDENTIFIED'])
      .lt('updated_at', fourteenDaysAgo)

    if (decisionsError) console.warn('[alerts] blocked decisions query failed:', decisionsError)
    for (const decision of blockedDecisions ?? []) {
      alerts.push({
        id: `blocked_decision_${decision.id}`,
        type: 'blocked_decision',
        severity: 'medium',
        title: `Blocked decision: ${decision.title}`,
        object_id: decision.id,
        object_type: 'decision',
        meta: { status: decision.status, updated_at: decision.updated_at },
      })
    }

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('[alerts]', error)
    return NextResponse.json(
      { alerts: [], error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
