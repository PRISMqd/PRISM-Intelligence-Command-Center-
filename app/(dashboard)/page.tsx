import { createServerSupabaseClient } from '@/lib/supabase-server'
import FounderBriefPanel from '@/components/panels/FounderBriefPanel'
import OrgHealthPanel from '@/components/panels/OrgHealthPanel'
import ActivityFeedPanel from '@/components/panels/ActivityFeedPanel'
import AlertQueuePanel from '@/components/panels/AlertQueuePanel'
import GhostNotesPanel from '@/components/panels/GhostNotesPanel'

export default async function TodayPage() {
  const supabase = await createServerSupabaseClient()

  const [briefResult, metricsResult, eventsResult, ghostNotesResult] =
    await Promise.all([
      supabase
        .from('briefs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('metrics')
        .select('*')
        .eq('metric_type', 'org_health')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
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

  const brief = briefResult.data ?? null
  const orgHealthMetrics = (metricsResult.data ?? []) as import('@/lib/types').OrgHealthDimension[]
  const provenanceEvents = eventsResult.data ?? []
  const ghostNotes = ghostNotesResult.data ?? []

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
