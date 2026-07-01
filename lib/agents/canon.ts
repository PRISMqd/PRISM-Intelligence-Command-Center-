// Agent 03: Canon — Institutional knowledge, provenance, ontology, Decision Registry
// governance. Spec: PRISM Canon Book I Complete v1.0 (EA-003), PIOS Book I Vol VI.
//
// Constitutional requirement (Canon Vol III 3.15): every agent must expose
// Capability / Knowledge / Reasoning as inspectable interfaces, not just act.
// This module returns all three explicitly rather than only performing actions.

export const CANON_CAPABILITY = [
  'Verify provenance chains for all new knowledge objects',
  'Flag knowledge objects that violate Canon invariants',
  'Govern the Decision Registry as a living knowledge resource',
  'Monitor for knowledge drift and flag affected objects for review',
  'Produce knowledge graph health reports',
]

export const CANON_KNOWLEDGE = [
  'claims (provenance, evidence linkage)',
  'evidence (originating source, funding/COI disclosure)',
  'decisions (Decision Registry, rationale, review status)',
  'provenance_events (chain-of-custody for every knowledge object)',
]

// The subset of the Canon's 10 Ontological Invariants (Vol III Ch. 4) that are
// mechanically checkable against the current schema. Canon flags violations —
// per its Decision Boundaries, it does not resolve them unilaterally.
const INVARIANTS = {
  1: 'No claim may exist without provenance.',
  2: 'No evidence may exist without an originating source, with documented funding relationships and conflict of interest disclosures.',
  3: 'No decision may exist without explicit rationale.',
  6: 'No knowledge object may be silently deleted.',
}

export async function runCanonValidator(db: any, now: string) {
  const violations: { invariant: number; rule: string; object_type: string; object_id: string; detail: string }[] = []

  // Invariant 3: decisions require explicit rationale
  const { data: decisions } = await db
    .from('decisions')
    .select('id, title, decision_rationale')
  for (const d of decisions ?? []) {
    if (!d.decision_rationale || d.decision_rationale.trim() === '') {
      violations.push({
        invariant: 3,
        rule: INVARIANTS[3],
        object_type: 'decision',
        object_id: d.id,
        detail: `Decision "${d.title}" has no recorded rationale.`,
      })
    }
  }

  // Invariant 2: evidence requires an originating source
  const { data: evidence } = await db.from('evidence').select('id, source_type, title')
  for (const e of evidence ?? []) {
    if (!e.source_type) {
      violations.push({
        invariant: 2,
        rule: INVARIANTS[2],
        object_type: 'evidence',
        object_id: e.id,
        detail: `Evidence "${e.title ?? e.id}" has no originating source_type.`,
      })
    }
  }

  // Invariant 1: claims require provenance — approximated as having at least
  // one provenance_events row referencing the same object_id.
  const { data: claims } = await db.from('claims').select('id, object_id, claim_text')
  const { data: provEvents } = await db.from('provenance_events').select('object_id')
  const provenancedObjects = new Set((provEvents ?? []).map((p: any) => p.object_id).filter(Boolean))
  for (const c of claims ?? []) {
    if (!c.object_id || !provenancedObjects.has(c.object_id)) {
      violations.push({
        invariant: 1,
        rule: INVARIANTS[1],
        object_type: 'claim',
        object_id: c.id,
        detail: `Claim "${(c.claim_text ?? '').slice(0, 80)}" has no linked provenance event.`,
      })
    }
  }

  // Record each new violation as a canon_violation object (Invariant 6: flag,
  // never silently delete or overwrite — check for existing before inserting).
  const { data: existingFlags } = await db
    .from('objects')
    .select('name')
    .eq('object_type', 'canon_violation')
  const existingNames = new Set((existingFlags ?? []).map((o: any) => o.name))

  let created = 0
  for (const v of violations) {
    const name = `Invariant ${v.invariant} violation: ${v.object_type} ${v.object_id}`.slice(0, 80)
    if (existingNames.has(name)) continue
    await db.from('objects').insert({
      object_type: 'canon_violation',
      name,
      description: v.detail,
      status: 'active',
      metadata: { invariant: v.invariant, rule: v.rule, object_type: v.object_type, object_id: v.object_id },
      created_at: now,
    })
    created++
  }

  return {
    summary: `Canon Validator swept ${decisions?.length ?? 0} decisions, ${evidence?.length ?? 0} evidence records, ${claims?.length ?? 0} claims — ${violations.length} invariant violations found (${created} newly flagged)`,
    violations_found: violations.length,
    newly_flagged: created,
  }
}

export async function runCanonAgent(db: any, now: string) {
  const validator = await runCanonValidator(db, now)
  return validator.summary
}
