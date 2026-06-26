import { createServerSupabaseClient } from '@/lib/supabase-server'
import ClaimsView from '@/components/views/ClaimsView'
import type { ClaimStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ClaimsPage() {
  const supabase = await createServerSupabaseClient()

  const [claimsResult, statusResult] = await Promise.all([
    supabase
      .from('claims')
      .select(`
        id,
        claim_text,
        claim_type,
        status,
        confidence_score,
        evidence_count,
        last_reviewed_at,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('claims')
      .select('status'),
  ])

  const claims = claimsResult.data ?? []

  // Compute status counts
  const statusCounts: Record<string, number> = {
    supported: 0,
    unsupported: 0,
    contested: 0,
    unknown: 0,
  }
  for (const row of (statusResult.data ?? []) as Array<{ status: string | null }>) {
    const s = (row.status ?? 'unknown') as ClaimStatus
    if (s in statusCounts) {
      statusCounts[s]++
    } else {
      statusCounts.unknown++
    }
  }

  return (
    <ClaimsView
      claims={claims}
      statusCounts={statusCounts}
    />
  )
}
