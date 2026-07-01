import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { CANON_CAPABILITY, CANON_KNOWLEDGE } from '@/lib/agents/canon'
import { ALETHEIA_CAPABILITY, ALETHEIA_KNOWLEDGE } from '@/lib/agents/aletheia'

// Canon Vol III 3.15: every agent must expose Capability, Knowledge, and
// Reasoning as inspectable interfaces. This route is that inspection surface.
const INTERFACES: Record<string, { capability: string[]; knowledge: string[] }> = {
  Canon: { capability: CANON_CAPABILITY, knowledge: CANON_KNOWLEDGE },
  Aletheia: { capability: ALETHEIA_CAPABILITY, knowledge: ALETHEIA_KNOWLEDGE },
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const supabase = createServiceClient()
  const db = supabase as any

  const { data: agent, error } = await db.from('agents').select('*').eq('name', name).maybeSingle()
  if (error || !agent) {
    return NextResponse.json({ error: 'agent not found' }, { status: 404 })
  }

  const iface = INTERFACES[name]

  const { data: recentEvents } = await db
    .from('provenance_events')
    .select('*')
    .eq('actor_name', name)
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    agent,
    capability: iface?.capability ?? null,
    knowledge: iface?.knowledge ?? null,
    reasoning: 'Inspectable via recent_runs — each provenance_events summary documents what the agent found and why, produced deterministically from queried table state, not opaque model inference.',
    recent_runs: recentEvents ?? [],
  })
}
