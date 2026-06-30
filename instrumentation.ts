export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  try {
    const { createClient } = await import('@supabase/supabase-js')

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rmbjqyidvuvnnzirglpj.supabase.co'
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return

    const db = createClient(supabaseUrl, serviceKey) as any

    // Check if metrics already exist — skip if seeded
    const { data: existing } = await db
      .from('metrics')
      .select('id')
      .eq('metric_type', 'org_health')
      .limit(1)

    if (existing && existing.length > 0) return

    const ORG_HEALTH_METRICS = [
      {
        metric_name: 'Reality Alignment Index',
        dimension: 'reality_alignment_index',
        value: 72,
        delta: 3,
        trend: 'up',
        inputs: { sparkline_data: [62, 65, 66, 68, 70, 72] },
        metadata: { color: '#F59E0B' },
      },
      {
        metric_name: 'Evidence Health',
        dimension: 'evidence_health',
        value: 54,
        delta: -4,
        trend: 'down',
        inputs: { sparkline_data: [61, 60, 59, 57, 56, 54] },
        metadata: { color: '#EF4444' },
      },
      {
        metric_name: 'Decision Quality',
        dimension: 'decision_quality',
        value: 81,
        delta: 5,
        trend: 'up',
        inputs: { sparkline_data: [72, 74, 76, 78, 79, 81] },
        metadata: { color: '#10B981' },
      },
      {
        metric_name: 'Assumption Risk',
        dimension: 'assumption_risk',
        value: 43,
        delta: 0,
        trend: 'flat',
        inputs: { sparkline_data: [41, 44, 42, 45, 43, 43] },
        metadata: { color: '#EF4444' },
      },
      {
        metric_name: 'Unknown Burden',
        dimension: 'unknown_burden',
        value: 63,
        delta: 2,
        trend: 'up',
        inputs: { sparkline_data: [57, 58, 60, 61, 62, 63] },
        metadata: { color: '#F59E0B' },
      },
      {
        metric_name: 'Execution Velocity',
        dimension: 'execution_velocity',
        value: 77,
        delta: 4,
        trend: 'up',
        inputs: { sparkline_data: [68, 70, 72, 74, 75, 77] },
        metadata: { color: '#10B981' },
      },
    ]

    const FOCUS_ITEMS = [
      {
        id: 'fi-1',
        rank: 1,
        title: 'Resolve FDA 510(k) submission gap analysis',
        description: '3 supporting claims lack evidence — blocks regulatory pathway decision',
        focus_score: 0.91,
      },
      {
        id: 'fi-2',
        rank: 2,
        title: 'Complete Q3 clinical outcomes model',
        description: 'Required for Series B investor deck due in 14 days',
        focus_score: 0.84,
      },
      {
        id: 'fi-3',
        rank: 3,
        title: 'Review payor reimbursement assumption',
        description: 'Last validated 47 days ago — risk score elevated to 0.78',
        focus_score: 0.76,
      },
      {
        id: 'fi-4',
        rank: 4,
        title: 'Close open contradiction: efficacy vs safety tradeoff',
        description: 'Claims C-104 and C-117 in direct conflict — blocks DECIDE-003',
        focus_score: 0.68,
      },
      {
        id: 'fi-5',
        rank: 5,
        title: 'Schedule outcome review for DECIDE-001',
        description: 'Decision outcome window passed 12 days ago — calibration score pending',
        focus_score: 0.55,
      },
    ]

    const GHOST_NOTES = [
      {
        inference_basis:
          'No evidence or claims registered for competitor pricing in the PAC market segment. Decision D-7 assumed this without documentation.',
        confidence: 'high',
        confidence_score: 0.82,
      },
      {
        inference_basis:
          'CMS reimbursement pathway referenced in 3 decisions but no formal claim or evidence object exists for it in the knowledge base.',
        confidence: 'medium',
        confidence_score: 0.61,
      },
      {
        inference_basis:
          'Post-market surveillance workflow references a monitoring protocol not registered in the knowledge base.',
        confidence: 'low',
        confidence_score: 0.28,
      },
      {
        inference_basis:
          'Patient adherence rate assumption (>85%) underpins the efficacy model but no primary data source has been linked.',
        confidence: 'medium',
        confidence_score: 0.55,
      },
    ]

    await db.from('metrics').insert(
      ORG_HEALTH_METRICS.map(m => ({
        metric_type: 'org_health',
        metric_name: m.metric_name,
        dimension: m.dimension,
        value: m.value,
        delta: m.delta,
        trend: m.trend,
        inputs: m.inputs,
        metadata: m.metadata,
        computed_by: 'seed',
        period_type: 'instant',
        unit: 'score',
      }))
    )

    const today = new Date().toISOString().split('T')[0]
    await db.from('briefs').upsert(
      {
        brief_type: 'daily',
        brief_date: today,
        title: `Daily Brief — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
        summary:
          'Strong execution momentum with 3 tasks at critical priority. Evidence health requires immediate attention — 4 claims flagged as unsupported. Decision quality trending up following DECIDE-002 outcome review.',
        focus_items: FOCUS_ITEMS,
        org_health_snapshot: {
          rai: 72,
          evidence_health: 54,
          decision_quality: 81,
          assumption_risk: 43,
          unknown_burden: 63,
          execution_velocity: 77,
        },
        generated_by: 'brief_generator_agent',
        generated_at: new Date().toISOString(),
        objects_processed: 142,
        is_valid: true,
      },
      { onConflict: 'brief_date' }
    )

    await db.from('objects').insert(
      GHOST_NOTES.map(g => ({
        object_type: 'ghost_note',
        name: g.inference_basis.slice(0, 80),
        description: g.inference_basis,
        status: 'active',
        confidence_score: g.confidence_score,
        metadata: {
          inference_basis: g.inference_basis,
          confidence: g.confidence,
        },
      }))
    )
  } catch {
    // Non-fatal: instrumentation errors must not crash the server
  }
}
