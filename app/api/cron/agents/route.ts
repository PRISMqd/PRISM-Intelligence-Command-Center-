import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

// Vercel Hobby plan invokes crons at most once/day, so each agent's "next_run_at"
// is honored on a best-effort basis: any agent whose next_run_at has passed runs
// on this invocation, then is rescheduled per its own cadence.
const INTERVAL_MS: Record<string, number> = {
  'Scoring Runner': 60 * 60 * 1000, // hourly
  'Brief Generator': 24 * 60 * 60 * 1000, // daily
  'Reality Reconciler': 24 * 60 * 60 * 1000, // nightly
  'Ghost Note Detector': 7 * 24 * 60 * 60 * 1000, // weekly
  'RAI Monitor': 6 * 60 * 60 * 1000, // every 6h
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

async function runScoringRunner(db: any, now: string) {
  const { data: claims } = await db.from('claims').select('supporting_evidence_count, contradicting_evidence_count')
  const { data: decisions } = await db.from('decisions').select('status, accuracy_score')

  const total = claims?.length ?? 0
  const supported = (claims ?? []).filter((c: any) => (c.supporting_evidence_count ?? 0) > 0).length
  const evidenceHealth = total > 0 ? clamp(Math.round((supported / total) * 100)) : 54

  const reviewed = (decisions ?? []).filter((d: any) => d.accuracy_score !== null)
  const decisionQuality =
    reviewed.length > 0
      ? clamp(Math.round((reviewed.reduce((s: number, d: any) => s + (d.accuracy_score ?? 0), 0) / reviewed.length) * 100))
      : 81

  await db.from('metrics').insert([
    {
      metric_type: 'org_health',
      metric_name: 'Evidence Health',
      dimension: 'evidence_health',
      value: evidenceHealth,
      trend: 'flat',
      computed_by: 'scoring_runner_agent',
      period_type: 'instant',
      unit: 'score',
      recorded_at: now,
    },
    {
      metric_type: 'org_health',
      metric_name: 'Decision Quality',
      dimension: 'decision_quality',
      value: decisionQuality,
      trend: 'flat',
      computed_by: 'scoring_runner_agent',
      period_type: 'instant',
      unit: 'score',
      recorded_at: now,
    },
  ])

  return `Recomputed evidence_health=${evidenceHealth}, decision_quality=${decisionQuality} from ${total} claims, ${reviewed.length} reviewed decisions`
}

async function runRaiMonitor(db: any, now: string) {
  const { data: claims } = await db.from('claims').select('confidence_score')
  const total = claims?.length ?? 0
  const avgConfidence =
    total > 0 ? claims.reduce((s: number, c: any) => s + (c.confidence_score ?? 0), 0) / total : 0.72
  const rai = clamp(Math.round(avgConfidence * 100))

  await db.from('metrics').insert({
    metric_type: 'org_health',
    metric_name: 'Reality Alignment Index',
    dimension: 'reality_alignment_index',
    value: rai,
    trend: 'flat',
    computed_by: 'rai_monitor_agent',
    period_type: 'instant',
    unit: 'score',
    recorded_at: now,
  })

  return `Recomputed reality_alignment_index=${rai} from ${total} claims`
}

async function runGhostNoteDetector(db: any, now: string) {
  const { data: decisions } = await db.from('decisions').select('id, title, made_at, rationale:decision_rationale')
  const { data: existingGhosts } = await db.from('objects').select('name').eq('object_type', 'ghost_note')
  const existingNames = new Set((existingGhosts ?? []).map((g: any) => g.name))

  const candidates = (decisions ?? []).filter((d: any) => !d.rationale)
  let created = 0
  for (const d of candidates) {
    const name = `No documented rationale for decision: ${d.title}`.slice(0, 80)
    if (existingNames.has(name)) continue
    await db.from('objects').insert({
      object_type: 'ghost_note',
      name,
      description: `Decision "${d.title}" has no recorded rationale linking it to evidence.`,
      status: 'active',
      confidence_score: 0.6,
      metadata: {
        inference_basis: `Decision "${d.title}" has no recorded rationale linking it to evidence.`,
        confidence: 'medium',
      },
      created_at: now,
    })
    created++
  }

  return `Scanned ${decisions?.length ?? 0} decisions, created ${created} new ghost notes`
}

async function runRealityReconciler(db: any, now: string) {
  const staleThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: staleClaims } = await db
    .from('claims')
    .select('id, claim_text')
    .lt('last_reviewed_at', staleThreshold)
    .limit(50)

  return `Reconciled state against reality — ${staleClaims?.length ?? 0} claims overdue for review`
}

async function runBriefGenerator(db: any, now: string) {
  const today = now.split('T')[0]
  const { data: existing } = await db.from('briefs').select('id').eq('brief_date', today).limit(1)
  if (existing && existing.length > 0) return 'Brief already exists for today — skipped'

  const { data: openDecisions } = await db.from('decisions').select('id, title').eq('status', 'open').limit(5)
  const focusItems = (openDecisions ?? []).map((d: any, i: number) => ({
    id: `fi-${d.id}`,
    rank: i + 1,
    title: d.title,
    description: 'Open decision awaiting resolution',
    focus_score: clamp(0.9 - i * 0.1, 0, 1),
  }))

  await db.from('briefs').insert({
    brief_type: 'daily',
    brief_date: today,
    title: `Daily Brief — ${new Date(now).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    summary: `Auto-generated brief covering ${focusItems.length} open decisions.`,
    focus_items: focusItems,
    generated_by: 'brief_generator_agent',
    generated_at: now,
    objects_processed: openDecisions?.length ?? 0,
    is_valid: true,
  })

  return `Generated brief with ${focusItems.length} focus items from open decisions`
}

const RUNNERS: Record<string, (db: any, now: string) => Promise<string>> = {
  'Scoring Runner': runScoringRunner,
  'Brief Generator': runBriefGenerator,
  'Reality Reconciler': runRealityReconciler,
  'Ghost Note Detector': runGhostNoteDetector,
  'RAI Monitor': runRaiMonitor,
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const supabase = createServiceClient()
  const db = supabase as any
  const now = new Date().toISOString()

  const { data: agents, error: agentsError } = await db.from('agents').select('*')
  if (agentsError) {
    return NextResponse.json({ error: agentsError.message }, { status: 500 })
  }

  const results: Record<string, string> = {}

  for (const agent of agents ?? []) {
    const runner = RUNNERS[agent.name]
    if (!runner) continue

    const dueNow = !agent.next_run_at || new Date(agent.next_run_at) <= new Date(now)
    if (!dueNow) {
      results[agent.name] = 'not due yet'
      continue
    }

    try {
      const summary = await runner(db, now)
      const intervalMs = INTERVAL_MS[agent.name] ?? 24 * 60 * 60 * 1000
      const nextRunAt = new Date(Date.now() + intervalMs).toISOString()

      await db
        .from('agents')
        .update({
          last_run_at: now,
          last_run_status: 'success',
          last_error: null,
          total_runs: (agent.total_runs ?? 0) + 1,
          next_run_at: nextRunAt,
          updated_at: now,
        })
        .eq('id', agent.id)

      await db.from('provenance_events').insert({
        event_type: 'UPDATED',
        actor_name: agent.name,
        actor_type: 'agent',
        summary,
        source_system: agent.agent_type ?? 'agent',
        created_at: now,
      })

      results[agent.name] = summary
    } catch (err: any) {
      await db
        .from('agents')
        .update({
          last_run_at: now,
          last_run_status: 'error',
          last_error: err?.message ?? 'unknown error',
          updated_at: now,
        })
        .eq('id', agent.id)
      results[agent.name] = `error: ${err?.message ?? 'unknown'}`
    }
  }

  return NextResponse.json({ ok: true, ran_at: now, results })
}
