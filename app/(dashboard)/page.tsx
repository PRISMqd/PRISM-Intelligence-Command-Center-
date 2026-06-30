import { createServerSupabaseClient } from '@/lib/supabase-server'
import FounderBriefPanel from '@/components/panels/FounderBriefPanel'
import OrgHealthPanel from '@/components/panels/OrgHealthPanel'
import ActivityFeedPanel from '@/components/panels/ActivityFeedPanel'
import AlertQueuePanel from '@/components/panels/AlertQueuePanel'
import GhostNotesPanel from '@/components/panels/GhostNotesPanel'
import type { OrgHealthDimension } from '@/lib/types'

export default async function TodayPage() {
  const supabase = await createServerSupabaseClient()

  const [briefResult, metricsResult, eventsResult, ghostNotesResult] =
    await Promise.all([
      supabase
        .from('briefs')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('v_org_health_latest')
        .select('*'),
      supabase
        .from('provenance_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('objects')
        .select('*')
        .eq('object_type', 'ghost_note')
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
    ])

  const briefRaw = briefResult.data ?? null
  const brief = briefRaw ? {
    id: briefRaw.id,
    date: briefRaw.brief_date,
    generated_at: briefRaw.generated_at,
    focus_items: briefRaw.focus_items ?? [],
  } : null

  const orgHealthMetrics: OrgHealthDimension[] = (metricsResult.data ?? []).map((m: any) => ({
    key: m.dimension ?? m.metric_name,
    label: m.metric_name,
    score: m.value,
    sparkline_data: (m.inputs as any)?.sparkline_data ?? [],
    delta: m.delta ?? 0,
    delta_direction: (m.trend as 'up' | 'down' | 'flat') ?? 'flat',
    color: (m.metadata as any)?.color ?? '#6B7280',
  }))

  const provenanceEvents = eventsResult.data ?? []

  const ghostNotes = (ghostNotesResult.data ?? []).map((obj: any) => ({
    id: obj.id,
    inference_basis: (obj.metadata as any)?.inference_basis ?? obj.description ?? obj.name,
    confidence: (obj.metadata as any)?.confidence ?? (
      obj.confidence_score >= 0.7 ? 'high' : obj.confidence_score >= 0.4 ? 'medium' : 'low'
    ),
    created_at: obj.created_at,
  }))

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left column */}
      <div className="col-span-4 flex flex-col gap-6">
        <FounderBriefPanel brief={brief} />
        <AlertQueuePanel />
      </div>

      {/* Center column */}
      <div className="col-span-5 flex flex-col gap-6">
        <OrgHealthPanel metrics={orgHealthMetrics} />
        <ActivityFeedPanel initialEvents={provenanceEvents as any} />
      </div>

      {/* Right column */}
      <div className="col-span-3">
        <GhostNotesPanel ghostNotes={ghostNotes} />
      </div>
    </div>
  )
}
