// Agent 25: Aletheia — Truth maintenance and contradiction resolution
// Spec: PRISM Canon Book I Complete v1.0 (EA-025)
// Authority: flag contradictions, escalate to governance — NO resolution authority.
// Aletheia never chooses between conflicting claims; it documents and routes.

export const ALETHEIA_CAPABILITY = [
  'Detect contradictions across the knowledge graph',
  'Detect knowledge drift against update triggers (review_due_at)',
  'Verify provenance chain integrity',
  'Flag deprecated objects still in active use',
  'Route contradictions to governance — never resolve them unilaterally',
]

export const ALETHEIA_KNOWLEDGE = [
  'claims (confidence, supporting/contradicting evidence counts, review schedule)',
  'contradictions (existing flagged conflicts)',
  'provenance_events (chain-of-custody)',
  'objects (status, deprecation state)',
]

async function runContradictionSubagent(db: any, now: string) {
  // Heuristic: a claim with more contradicting than supporting evidence is a
  // live evidential conflict. Aletheia documents it; it does not decide which
  // side is correct.
  const { data: claims } = await db
    .from('claims')
    .select('id, claim_text, supporting_evidence_count, contradicting_evidence_count, object_id')
  const { data: existing } = await db.from('contradictions').select('claim_a_id')
  const alreadyFlagged = new Set((existing ?? []).map((c: any) => c.claim_a_id))

  let flagged = 0
  for (const c of claims ?? []) {
    const contradicting = c.contradicting_evidence_count ?? 0
    const supporting = c.supporting_evidence_count ?? 0
    if (contradicting > 0 && contradicting >= supporting && !alreadyFlagged.has(c.id)) {
      await db.from('contradictions').insert({
        claim_a_id: c.id,
        object_id: c.object_id,
        severity: contradicting > supporting * 2 ? 'high' : 'medium',
        status: 'flagged',
        description: `Claim "${(c.claim_text ?? '').slice(0, 100)}" has ${contradicting} contradicting vs ${supporting} supporting evidence records. Aletheia has no resolution authority — routed to governance.`,
        created_at: now,
      })
      flagged++
    }
  }
  return { flagged, scanned: claims?.length ?? 0 }
}

async function runDriftSubagent(db: any, now: string) {
  const { data: overdueClaims } = await db
    .from('claims')
    .select('id')
    .lt('review_due_at', now)
  const { data: overdueAssumptions } = await db
    .from('assumptions')
    .select('id')
    .lt('review_due_at', now)
  return {
    drifted_claims: overdueClaims?.length ?? 0,
    drifted_assumptions: overdueAssumptions?.length ?? 0,
  }
}

async function runProvenanceSubagent(db: any, now: string) {
  const { data: claims } = await db.from('claims').select('id, object_id')
  const { data: provEvents } = await db.from('provenance_events').select('object_id')
  const provenanced = new Set((provEvents ?? []).map((p: any) => p.object_id).filter(Boolean))
  const orphaned = (claims ?? []).filter((c: any) => !c.object_id || !provenanced.has(c.object_id)).length
  return { orphaned_claims: orphaned, total_claims: claims?.length ?? 0 }
}

async function runArchiveSubagent(db: any, now: string) {
  const { data: deprecated } = await db.from('objects').select('id').eq('status', 'deprecated')
  const { data: activeDecisions } = await db.from('decisions').select('object_id').eq('status', 'active')
  const activeObjectIds = new Set((activeDecisions ?? []).map((d: any) => d.object_id).filter(Boolean))
  const deprecatedInUse = (deprecated ?? []).filter((o: any) => activeObjectIds.has(o.id)).length
  return { deprecated_in_active_use: deprecatedInUse }
}

export async function runAletheiaAgent(db: any, now: string) {
  const [contradiction, drift, provenance, archive] = await Promise.all([
    runContradictionSubagent(db, now),
    runDriftSubagent(db, now),
    runProvenanceSubagent(db, now),
    runArchiveSubagent(db, now),
  ])

  return `Aletheia swept knowledge graph: ${contradiction.flagged} new contradictions flagged (of ${contradiction.scanned} claims scanned), ${drift.drifted_claims + drift.drifted_assumptions} objects overdue for review, ${provenance.orphaned_claims}/${provenance.total_claims} claims missing provenance, ${archive.deprecated_in_active_use} deprecated objects still in active use`
}
