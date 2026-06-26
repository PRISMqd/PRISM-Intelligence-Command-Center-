import { createServerSupabaseClient } from '@/lib/supabase'
import SystemHealthView from '@/components/views/SystemHealthView'

export const dynamic = 'force-dynamic'

export default async function SystemHealthPage() {
  const supabase = await createServerSupabaseClient()

  const [metricsResult, contradictionsResult, agentsResult, objectsResult, provenanceResult] =
    await Promise.all([
      supabase
        .from('metrics')
        .select(
          'id, metric_type, metric_name, dimension, value, trend, delta, delta_percent, recorded_at, period_start, notes'
        )
        .in('metric_type', ['rai', 'org_health'])
        .order('recorded_at', { ascending: false }),

      supabase
        .from('contradictions')
        .select(
          `id, severity, status, description, created_at, updated_at,
           claim_a:claim_a_id ( id, claim_text ),
           claim_b:claim_b_id ( id, claim_text )`
        )
        .neq('status', 'resolved')
        .order('created_at', { ascending: false })
        .limit(20),

      supabase
        .from('agents')
        .select(
          'id, name, agent_type, status, last_run_at, next_run_at, last_run_status, description, is_system_agent'
        )
        .eq('is_system_agent', true)
        .order('name')
        .limit(5),

      supabase
        .from('objects')
        .select('id, name, object_type, updated_at')
        .is('deleted_at', null)
        .eq('is_archived', false)
        .order('updated_at', { ascending: true })
        .limit(10),

      supabase
        .from('provenance_events')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1),
    ])

  return (
    <SystemHealthView
      metrics={metricsResult.data ?? []}
      contradictions={contradictionsResult.data ?? []}
      agents={agentsResult.data ?? []}
      staleObjects={objectsResult.data ?? []}
      lastProvenanceEvent={(provenanceResult.data ?? [])[0] ?? null}
    />
  )
}
