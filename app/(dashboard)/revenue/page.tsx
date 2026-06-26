import { createServerSupabaseClient } from '@/lib/supabase'
import RevenueView from '@/components/views/RevenueView'

export const dynamic = 'force-dynamic'

export default async function RevenuePage() {
  const supabase = await createServerSupabaseClient()

  const { data: metrics } = await supabase
    .from('metrics')
    .select(
      `id, metric_type, metric_name, dimension, value, unit, value_label,
       period_start, period_end, period_type, recorded_at, previous_value,
       delta, delta_percent, trend, notes, current_status, created_at`
    )
    .in('metric_type', ['revenue', 'mrr', 'pipeline', 'conversion'])
    .order('recorded_at', { ascending: false })

  return <RevenueView metrics={metrics ?? []} />
}
