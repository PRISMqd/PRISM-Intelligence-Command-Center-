import { createServerSupabaseClient } from '@/lib/supabase'
import EvidenceView from '@/components/views/EvidenceView'

export const dynamic = 'force-dynamic'

export default async function EvidencePage() {
  const supabase = await createServerSupabaseClient()

  const [evidenceResult, claimLinksResult] = await Promise.all([
    supabase
      .from('evidence')
      .select(`
        id,
        claim_id,
        source_id,
        object_id,
        evidence_type,
        summary,
        content,
        excerpt,
        supports_claim,
        quality_scores,
        quality_score,
        data_collection_date,
        collected_at,
        last_verified_at,
        notes,
        created_at,
        updated_at,
        sources (
          id,
          title,
          source_type,
          publication,
          url,
          authors,
          doi,
          publication_date,
          reliability_score,
          peer_reviewed
        )
      `)
      .order('created_at', { ascending: false }),

    // Count linked claims per evidence via claim_id
    supabase
      .from('evidence')
      .select('id, claim_id'),
  ])

  const rawEvidence = evidenceResult.data ?? []

  // Build linked claim counts: evidence can appear with multiple claim_ids
  // Since schema has claim_id per row, we need to group by object_id or just count distinct claim_ids per evidence id
  const claimCountMap: Record<string, number> = {}
  for (const row of claimLinksResult.data ?? []) {
    if (row.claim_id) {
      claimCountMap[row.id] = (claimCountMap[row.id] ?? 0) + 1
    }
  }

  const now = Date.now()
  const MS_30 = 30 * 24 * 60 * 60 * 1000
  const MS_90 = 90 * 24 * 60 * 60 * 1000

  let staleCount = 0
  let veryStaleCount = 0
  let qualitySum = 0
  let qualityCount = 0

  for (const ev of rawEvidence) {
    const dateStr = ev.data_collection_date ?? ev.collected_at ?? ev.created_at
    if (dateStr) {
      const age = now - new Date(dateStr).getTime()
      if (age > MS_90) veryStaleCount++
      else if (age > MS_30) staleCount++
    }
    if (ev.quality_score != null) {
      qualitySum += ev.quality_score
      qualityCount++
    }
  }

  const avgQuality = qualityCount > 0 ? qualitySum / qualityCount : null

  return (
    <EvidenceView
      evidence={rawEvidence as any}
      claimCountMap={claimCountMap}
      staleCount={staleCount}
      veryStaleCount={veryStaleCount}
      avgQuality={avgQuality}
    />
  )
}
