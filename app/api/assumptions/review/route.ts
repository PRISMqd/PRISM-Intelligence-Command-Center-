// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body as { id: string }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing required field: id' }, { status: 400 })
    }

    const writeClient = createServiceClient()

    // Update assumption: reset review timestamp and staleness counter
    const { error: updateError } = await writeClient
      .from('assumptions')
      .update({
        last_reviewed_at: new Date().toISOString(),
        time_since_review: 0,
      })
      .eq('id', id)

    if (updateError) throw updateError

    // Create provenance event recording the review action
    const { error: provenanceError } = await writeClient
      .from('provenance_events')
      .insert({
        object_type: 'assumption',
        object_id: id,
        event_type: 'reviewed',
        occurred_at: new Date().toISOString(),
        notes: 'Assumption marked as reviewed via API',
      })

    if (provenanceError) {
      // Non-fatal: log but do not fail the request
      console.warn('[assumptions/review] provenance insert failed:', provenanceError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[assumptions/review]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
