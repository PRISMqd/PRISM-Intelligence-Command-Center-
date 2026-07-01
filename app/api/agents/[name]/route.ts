import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { CANON_CAPABILITY, CANON_KNOWLEDGE } from '@/lib/agents/canon'
import { ALETHEIA_CAPABILITY, ALETHEIA_KNOWLEDGE } from '@/lib/agents/aletheia'
import { FOCUSOPS_CAPABILITY, FOCUSOPS_KNOWLEDGE } from '@/lib/agents/focusops'
import { CSO_CAPABILITY, CSO_KNOWLEDGE } from '@/lib/agents/chief-strategy-officer'
import { FOUNDEROS_CAPABILITY, FOUNDEROS_KNOWLEDGE } from '@/lib/agents/founderos'
import { KINGMAKER_CAPABILITY, KINGMAKER_KNOWLEDGE } from '@/lib/agents/kingmaker'
import { CATALYST_CAPABILITY, CATALYST_KNOWLEDGE } from '@/lib/agents/catalyst'
import { VANGUARD_CAPABILITY, VANGUARD_KNOWLEDGE } from '@/lib/agents/vanguard'
import { EVIDENCE_CAPABILITY, EVIDENCE_KNOWLEDGE } from '@/lib/agents/evidence'
import { TREASURY_CAPABILITY, TREASURY_KNOWLEDGE } from '@/lib/agents/treasury'
import { CITADEL_CAPABILITY, CITADEL_KNOWLEDGE } from '@/lib/agents/citadel'
import { COMPASS_CAPABILITY, COMPASS_KNOWLEDGE } from '@/lib/agents/compass'
import { NOVA_CAPABILITY, NOVA_KNOWLEDGE } from '@/lib/agents/nova'
import { ATLAS_CAPABILITY, ATLAS_KNOWLEDGE } from '@/lib/agents/atlas'
import { STEWARD_CAPABILITY, STEWARD_KNOWLEDGE } from '@/lib/agents/steward'
import { FORGE_CAPABILITY, FORGE_KNOWLEDGE } from '@/lib/agents/forge'
import { BEACON_CAPABILITY, BEACON_KNOWLEDGE } from '@/lib/agents/beacon'
import { FOUNDRY_CAPABILITY, FOUNDRY_KNOWLEDGE } from '@/lib/agents/foundry'
import { SIGNAL_CAPABILITY, SIGNAL_KNOWLEDGE } from '@/lib/agents/signal'
import { METIS_CAPABILITY, METIS_KNOWLEDGE } from '@/lib/agents/metis'
import { ARGUS_CAPABILITY, ARGUS_KNOWLEDGE } from '@/lib/agents/argus'
import { CHRONOS_CAPABILITY, CHRONOS_KNOWLEDGE } from '@/lib/agents/chronos'
import { HERMES_CAPABILITY, HERMES_KNOWLEDGE } from '@/lib/agents/hermes'
import { SOCRATES_CAPABILITY, SOCRATES_KNOWLEDGE } from '@/lib/agents/socrates'
import { HELIOS_CAPABILITY, HELIOS_KNOWLEDGE } from '@/lib/agents/helios'
import { THEMIS_CAPABILITY, THEMIS_KNOWLEDGE } from '@/lib/agents/themis'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Canon Vol III 3.15: every agent must expose Capability, Knowledge, and
// Reasoning as inspectable interfaces. This route is that inspection surface.
// All 26 canonical agents (EA-01 through EA-26) are registered below.
const INTERFACES: Record<string, { capability: string[]; knowledge: string[] }> = {
  Canon: { capability: CANON_CAPABILITY, knowledge: CANON_KNOWLEDGE },
  Aletheia: { capability: ALETHEIA_CAPABILITY, knowledge: ALETHEIA_KNOWLEDGE },
  FocusOps: { capability: FOCUSOPS_CAPABILITY, knowledge: FOCUSOPS_KNOWLEDGE },
  'Chief Strategy Officer': { capability: CSO_CAPABILITY, knowledge: CSO_KNOWLEDGE },
  FounderOS: { capability: FOUNDEROS_CAPABILITY, knowledge: FOUNDEROS_KNOWLEDGE },
  Kingmaker: { capability: KINGMAKER_CAPABILITY, knowledge: KINGMAKER_KNOWLEDGE },
  Catalyst: { capability: CATALYST_CAPABILITY, knowledge: CATALYST_KNOWLEDGE },
  Vanguard: { capability: VANGUARD_CAPABILITY, knowledge: VANGUARD_KNOWLEDGE },
  Evidence: { capability: EVIDENCE_CAPABILITY, knowledge: EVIDENCE_KNOWLEDGE },
  Treasury: { capability: TREASURY_CAPABILITY, knowledge: TREASURY_KNOWLEDGE },
  Citadel: { capability: CITADEL_CAPABILITY, knowledge: CITADEL_KNOWLEDGE },
  Compass: { capability: COMPASS_CAPABILITY, knowledge: COMPASS_KNOWLEDGE },
  Nova: { capability: NOVA_CAPABILITY, knowledge: NOVA_KNOWLEDGE },
  Atlas: { capability: ATLAS_CAPABILITY, knowledge: ATLAS_KNOWLEDGE },
  Steward: { capability: STEWARD_CAPABILITY, knowledge: STEWARD_KNOWLEDGE },
  Forge: { capability: FORGE_CAPABILITY, knowledge: FORGE_KNOWLEDGE },
  Beacon: { capability: BEACON_CAPABILITY, knowledge: BEACON_KNOWLEDGE },
  Foundry: { capability: FOUNDRY_CAPABILITY, knowledge: FOUNDRY_KNOWLEDGE },
  Signal: { capability: SIGNAL_CAPABILITY, knowledge: SIGNAL_KNOWLEDGE },
  Metis: { capability: METIS_CAPABILITY, knowledge: METIS_KNOWLEDGE },
  Argus: { capability: ARGUS_CAPABILITY, knowledge: ARGUS_KNOWLEDGE },
  Chronos: { capability: CHRONOS_CAPABILITY, knowledge: CHRONOS_KNOWLEDGE },
  Hermes: { capability: HERMES_CAPABILITY, knowledge: HERMES_KNOWLEDGE },
  Socrates: { capability: SOCRATES_CAPABILITY, knowledge: SOCRATES_KNOWLEDGE },
  Helios: { capability: HELIOS_CAPABILITY, knowledge: HELIOS_KNOWLEDGE },
  Themis: { capability: THEMIS_CAPABILITY, knowledge: THEMIS_KNOWLEDGE },
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
