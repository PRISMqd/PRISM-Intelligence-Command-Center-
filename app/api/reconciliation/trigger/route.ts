import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { scope } = body as { scope?: string }

    const writeClient = createServiceClient()

    const { data: event, error } = await writeClient
      .from('reconciliation_events')
      .insert({
        scope: scope ?? 'global',
        status: 'running',
        triggered_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) throw error

    console.log(`[reconciliation/trigger] event ${event.id} started for scope: ${scope ?? 'global'}`)

    return NextResponse.json({ success: true, event_id: event.id })
  } catch (error) {
    console.error('[reconciliation/trigger]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
