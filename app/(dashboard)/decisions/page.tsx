import { createServerSupabaseClient } from '@/lib/supabase'
import DecisionsView from '@/components/views/DecisionsView'

export const dynamic = 'force-dynamic'

export default async function DecisionsPage() {
  const supabase = await createServerSupabaseClient()

  // Fetch decisions with alternatives count via related table
  const { data: decisionsRaw } = await supabase
    .from('decisions')
    .select(`
      id,
      object_id,
      title,
      description,
      context,
      status,
      confidence_at_decision,
      selected_alternative_id,
      decision_rationale,
      made_by,
      made_at,
      expected_outcome,
      success_criteria,
      outcome_due_date,
      actual_outcome,
      accuracy_score,
      calibration_delta,
      lessons_learned,
      reviewed_at,
      notes,
      created_at,
      updated_at,
      alternatives(id)
    `)
    .order('created_at', { ascending: false })

  // Normalise: count alternatives
  const decisions = (decisionsRaw ?? []).map((d) => {
    const { alternatives, ...rest } = d as typeof d & { alternatives: { id: string }[] | null }
    return {
      ...rest,
      alternatives_count: (alternatives ?? []).length,
    }
  })

  return <DecisionsView decisions={decisions} />
}
