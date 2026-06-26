import { createServerSupabaseClient } from '@/lib/supabase'
import UnknownsView from '@/components/views/UnknownsView'

export const dynamic = 'force-dynamic'

export default async function UnknownsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: unknowns } = await supabase
    .from('unknowns')
    .select(`
      id,
      object_id,
      unknown_text,
      description,
      status,
      category,
      impact_if_resolved,
      probability_changes_decision,
      decision_value,
      cost_to_resolve,
      cost_of_delay,
      evi_score,
      investigation_notes,
      resolved_at,
      resolution_notes,
      notes,
      created_at,
      updated_at
    `)
    .order('evi_score', { ascending: false })

  return <UnknownsView unknowns={unknowns ?? []} />
}
