'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export interface SidebarCounts {
  objectsTotal: number
  claimsUnsupported: number
  staleEvidence: number
  openDecisions: number
  highRiskAssumptions: number
  highEVIUnknowns: number
  overdueTasks: number
  criticalRisks: number
  currentMRR: number | null
  raiScore: number | null
}

const DEFAULT_COUNTS: SidebarCounts = {
  objectsTotal: 0,
  claimsUnsupported: 0,
  staleEvidence: 0,
  openDecisions: 0,
  highRiskAssumptions: 0,
  highEVIUnknowns: 0,
  overdueTasks: 0,
  criticalRisks: 0,
  currentMRR: null,
  raiScore: null,
}

async function fetchSidebarCounts(): Promise<SidebarCounts> {
  const supabase = createClient()

  const [
    objectsResult,
    claimsResult,
    evidenceResult,
    decisionsResult,
    assumptionsResult,
    unknownsResult,
    tasksResult,
    risksResult,
    mrrResult,
    raiResult,
  ] = await Promise.all([
    supabase.from('objects').select('*', { count: 'exact', head: true }),

    supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'unsupported'),

    supabase
      .from('evidence')
      .select('*', { count: 'exact', head: true })
      .lt('last_verified_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

    supabase
      .from('decisions')
      .select('*', { count: 'exact', head: true })
      .not('status', 'in', '("REVIEWED","SUPERSEDED","ABANDONED")'),

    supabase
      .from('assumptions')
      .select('*', { count: 'exact', head: true })
      .gt('assumption_risk_score', 0.7)
      .eq('status', 'active'),

    supabase
      .from('unknowns')
      .select('*', { count: 'exact', head: true })
      .gt('evi_score', 0.5)
      .eq('status', 'open'),

    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .lt('due_date', new Date().toISOString())
      .not('status', 'in', '("DONE","CANCELLED")'),

    supabase
      .from('risks')
      .select('*', { count: 'exact', head: true })
      .gt('risk_score', 0.64)
      .in('mitigation_status', ['none', 'planned'])
      .eq('is_active', true),

    supabase
      .from('metrics')
      .select('value')
      .eq('metric_type', 'mrr')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),

    supabase
      .from('metrics')
      .select('value')
      .eq('metric_type', 'rai')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  return {
    objectsTotal: objectsResult.count ?? 0,
    claimsUnsupported: claimsResult.count ?? 0,
    staleEvidence: evidenceResult.count ?? 0,
    openDecisions: decisionsResult.count ?? 0,
    highRiskAssumptions: assumptionsResult.count ?? 0,
    highEVIUnknowns: unknownsResult.count ?? 0,
    overdueTasks: tasksResult.count ?? 0,
    criticalRisks: risksResult.count ?? 0,
    currentMRR: mrrResult.data?.value ?? null,
    raiScore: raiResult.data?.value ?? null,
  }
}

export function useSidebarCounts(): SidebarCounts {
  const [counts, setCounts] = useState<SidebarCounts>(DEFAULT_COUNTS)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await fetchSidebarCounts()
        if (!cancelled) {
          setCounts(data)
        }
      } catch (err) {
        console.error('[useSidebarCounts] fetch error:', err)
      }
    }

    load()

    const interval = setInterval(load, 60_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return counts
}
