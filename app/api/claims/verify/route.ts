import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body as { id: string; status: string }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing required field: id' }, { status: 400 })
    }
    if (!status) {
      return NextResponse.json({ success: false, error: 'Missing required field: status' }, { status: 400 })
    }

    const validStatuses = ['proposed', 'supported', 'unsupported', 'contested', 'unknown', 'deprecated', 'retracted']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const writeClient = createServiceClient()

    const { error } = await writeClient
      .from('claims')
      .update({
        status,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[claims/verify]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
