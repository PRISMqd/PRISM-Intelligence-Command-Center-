import { createServerSupabaseClient } from '@/lib/supabase'
import AssumptionsView from '@/components/views/AssumptionsView'

export const dynamic = 'force-dynamic'

export default async function AssumptionsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: assumptions } = await supabase
    .from('assumptions')
    .select(`
      id,
      object_id,
      assumption_text,
      status,
      importance,
      risk_if_false,
      confidence_gap,
      dependency_count,
      time_since_review,
      assumption_risk_score,
      current_confidence,
      last_reviewed_at,
      review_due_at,
      category,
      notes,
      created_at,
      updated_at
    `)
    .order('assumption_risk_score', { ascending: false })

  return <AssumptionsView assumptions={assumptions ?? []} />
}
