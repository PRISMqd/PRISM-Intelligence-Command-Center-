// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, resolution_notes, resolved_by_id } = body as {
      id: string
      resolution_notes: string
      resolved_by_id?: string
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing required field: id' }, { status: 400 })
    }
    if (!resolution_notes) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: resolution_notes' },
        { status: 400 }
      )
    }

    const writeClient = createServiceClient()

    const updatePayload: Record<string, unknown> = {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolution_notes,
    }
    if (resolved_by_id) {
      updatePayload.resolved_by_id = resolved_by_id
    }

    const { error } = await writeClient
      .from('unknowns')
      .update(updatePayload)
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[unknowns/resolve]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
