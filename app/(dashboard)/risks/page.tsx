import { createServerSupabaseClient } from '@/lib/supabase-server'
import RisksView from '@/components/views/RisksView'

export const dynamic = 'force-dynamic'

export default async function RisksPage() {
  const supabase = await createServerSupabaseClient()

  const { data: risks } = await supabase
    .from('risks')
    .select(`
      id,
      title,
      description,
      category,
      likelihood,
      impact,
      risk_score,
      mitigation_status,
      mitigation_plan,
      likelihood_rationale,
      impact_rationale,
      owner,
      linked_objects,
      review_history,
      last_reviewed_at,
      created_at,
      updated_at
    `)
    .order('risk_score', { ascending: false })

  return <RisksView risks={risks ?? []} />
}
