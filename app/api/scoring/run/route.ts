import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { tables } = body as { tables?: string[] }

    const scope = tables && tables.length > 0 ? tables.join(', ') : 'all tables'
    console.log(`[scoring/run] Scoring triggered for: ${scope}`)

    // Actual scoring is handled by database triggers on insert/update.
    // This endpoint acts as a manual signal / audit log entry point.

    return NextResponse.json({ success: true, message: 'Scoring triggered' })
  } catch (error) {
    console.error('[scoring/run]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
