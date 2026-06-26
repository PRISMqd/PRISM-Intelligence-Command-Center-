'use client'

import { useState, useMemo, useCallback } from 'react'
import { formatDistanceToNow, differenceInDays, parseISO, format } from 'date-fns'
import ConfidenceBar from '@/components/ui/ConfidenceBar'
import type { DecisionStatus } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Decision {
  id: string
  object_id: string | null
  title: string
  description: string | null
  context: string | null
  status: string | null
  confidence_at_decision: number | null
  selected_alternative_id: string | null
  decision_rationale: string | null
  made_by: string | null
  made_at: string | null
  expected_outcome: string | null
  success_criteria: string | null
  outcome_due_date: string | null
  actual_outcome: string | null
  accuracy_score: number | null
  calibration_delta: number | null
  lessons_learned: string | null
  reviewed_at: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
  alternatives_count: number
}

interface Alternative {
  id: string
  decision_id: string | null
  title: string
  description: string | null
  expected_value: number | null
  probability_of_success: number | null
  was_selected: boolean | null
  rejection_reason: string | null
  outcome_score: number | null
  outcome_notes: string | null
  created_at: string | null
}

interface DecisionsViewProps {
  decisions: Decision[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FLOW: DecisionStatus[] = [
  'IDENTIFIED',
  'FRAMING',
  'ALTERNATIVES_GENERATED',
  'ANALYZED',
  'RECOMMENDED',
  'MADE',
  'IMPLEMENTING',
  'OUTCOME_KNOWN',
  'REVIEWED',
]

const STATUS_BADGE: Record<string, string> = {
  IDENTIFIED: 'bg-gray-100 text-gray-600 border border-gray-300',
  FRAMING: 'bg-blue-100 text-blue-700 border border-blue-300',
  ALTERNATIVES_GENERATED: 'bg-indigo-100 text-indigo-700 border border-indigo-300',
  ANALYZED: 'bg-violet-100 text-violet-700 border border-violet-300',
  RECOMMENDED: 'bg-purple-100 text-purple-700 border border-purple-300',
  MADE: 'bg-cyan-100 text-cyan-800 border border-cyan-300',
  IMPLEMENTING: 'bg-amber-100 text-amber-800 border border-amber-300',
  OUTCOME_KNOWN: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  REVIEWED: 'bg-green-100 text-green-800 border border-green-300',
  SUPERSEDED: 'bg-gray-100 text-gray-400 border border-gray-200',
  ABANDONED: 'bg-red-100 text-red-500 border border-red-200',
}

const STATUS_FLOW_ACTIVE: Record<string, string> = {
  IDENTIFIED: 'bg-gray-400',
  FRAMING: 'bg-blue-500',
  ALTERNATIVES_GENERATED: 'bg-indigo-500',
  ANALYZED: 'bg-violet-500',
  RECOMMENDED: 'bg-purple-500',
  MADE: 'bg-cyan-600',
  IMPLEMENTING: 'bg-amber-500',
  OUTCOME_KNOWN: 'bg-emerald-500',
  REVIEWED: 'bg-green-500',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return '—'
  }
}

function shortDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

function statusBadgeClass(status: string | null): string {
  return STATUS_BADGE[status ?? ''] ?? 'bg-gray-100 text-gray-500 border border-gray-200'
}

function statusFlowIndex(status: string | null): number {
  return STATUS_FLOW.indexOf((status ?? '') as DecisionStatus)
}

function isAwaitingReview(decision: Decision): boolean {
  if (decision.status !== 'OUTCOME_KNOWN') return false
  if (!decision.updated_at) return false
  try {
    return differenceInDays(new Date(), parseISO(decision.updated_at)) > 14
  } catch {
    return false
  }
}

function accuracyBadge(score: number | null): { label: string; cls: string } | null {
  if (score == null) return null
  if (score >= 0.75) return { label: 'Accurate', cls: 'bg-green-100 text-green-800 border border-green-300' }
  if (score >= 0.5) return { label: 'Partial', cls: 'bg-amber-100 text-amber-800 border border-amber-300' }
  return { label: 'Off', cls: 'bg-red-100 text-red-700 border border-red-300' }
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  count,
  colorClass,
  warning,
}: {
  label: string
  count: number
  colorClass: string
  warning?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border bg-white px-5 py-3 shadow-sm min-w-[110px] ${
        warning ? 'border-amber-400 ring-1 ring-amber-300' : ''
      }`}
    >
      <span className={`text-2xl font-bold tabular-nums ${colorClass}`}>{count}</span>
      <span className={`mt-0.5 text-xs font-medium uppercase tracking-wide ${warning ? 'text-amber-600' : 'text-gray-500'}`}>
        {label}
      </span>
      {warning && (
        <span className="mt-0.5 text-[10px] text-amber-500 font-medium">waiting &gt;14 days</span>
      )}
    </div>
  )
}

// ─── Status Flow Stepper ─────────────────────────────────────────────────────

function StatusFlowStepper({ currentStatus }: { currentStatus: string | null }) {
  const activeIdx = statusFlowIndex(currentStatus)

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {STATUS_FLOW.map((step, idx) => {
        const isActive = idx === activeIdx
        const isPast = idx < activeIdx
        const isFuture = idx > activeIdx

        const dotColor = isActive
          ? STATUS_FLOW_ACTIVE[step] ?? 'bg-gray-400'
          : isPast
          ? 'bg-gray-300'
          : 'bg-gray-100 border border-gray-300'

        const label = step
          .replace('ALTERNATIVES_GENERATED', 'ALT. GEN.')
          .replace('OUTCOME_KNOWN', 'OUTCOME')
          .replace(/_/g, ' ')

        return (
          <div key={step} className="flex items-center shrink-0">
            {idx > 0 && (
              <div
                className={`h-px w-6 ${isPast || isActive ? 'bg-gray-300' : 'bg-gray-100'}`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-2.5 w-2.5 rounded-full transition-all ${dotColor} ${
                  isActive ? 'ring-2 ring-offset-1 ring-current' : ''
                }`}
              />
              <span
                className={`text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap ${
                  isActive
                    ? 'text-gray-800'
                    : isPast
                    ? 'text-gray-400'
                    : isFuture
                    ? 'text-gray-300'
                    : 'text-gray-300'
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Alternatives Sub-panel ───────────────────────────────────────────────────

function AlternativesSubPanel({
  decisionId,
  selectedAlternativeId,
}: {
  decisionId: string
  selectedAlternativeId: string | null
}) {
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)

  // Lazy load on first render
  if (!loaded && !loading) {
    setLoading(true)
  }

  // Fetch once
  useState(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { createClient } = await import('@/lib/supabase')
        const supabase = createClient()
        const { data } = await supabase
          .from('alternatives')
          .select('*')
          .eq('decision_id', decisionId)
          .order('was_selected', { ascending: false })
        if (!cancelled) {
          setAlternatives((data as Alternative[]) ?? [])
          setLoaded(true)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  })

  if (loading) {
    return (
      <div className="px-4 py-3 space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-10 rounded bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (alternatives.length === 0) {
    return (
      <div className="px-4 py-3 text-xs text-gray-400 italic">
        No alternatives recorded for this decision.
      </div>
    )
  }

  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
        Alternatives ({alternatives.length})
      </p>
      <div className="space-y-2">
        {alternatives.map((alt) => {
          const selected = alt.was_selected ?? alt.id === selectedAlternativeId
          return (
            <div
              key={alt.id}
              className={`rounded-lg border px-3 py-2.5 ${
                selected
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selected && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        Selected
                      </span>
                    )}
                    <span className="text-xs font-medium text-gray-800 truncate">{alt.title}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-gray-500">
                    {alt.expected_value != null && (
                      <span>
                        <span className="font-medium text-gray-400">Expected value</span>{' '}
                        <span className="tabular-nums font-semibold text-gray-600">{alt.expected_value.toFixed(2)}</span>
                      </span>
                    )}
                    {alt.probability_of_success != null && (
                      <span>
                        <span className="font-medium text-gray-400">P(success)</span>{' '}
                        <span className="tabular-nums font-semibold text-gray-600">
                          {(alt.probability_of_success * 100).toFixed(0)}%
                        </span>
                      </span>
                    )}
                    {alt.outcome_score != null && (
                      <span>
                        <span className="font-medium text-gray-400">Outcome score</span>{' '}
                        <span
                          className={`tabular-nums font-semibold ${
                            alt.outcome_score >= 0.7
                              ? 'text-green-700'
                              : alt.outcome_score >= 0.4
                              ? 'text-amber-700'
                              : 'text-red-600'
                          }`}
                        >
                          {(alt.outcome_score * 100).toFixed(0)}%
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Detail Panel ────────────────────────────────────────────────────────────

function DetailPanel({
  decision,
  onClose,
}: {
  decision: Decision
  onClose: () => void
}) {
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [loadingAlts, setLoadingAlts] = useState(true)

  useState(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { createClient } = await import('@/lib/supabase')
        const supabase = createClient()
        const { data } = await supabase
          .from('alternatives')
          .select('*')
          .eq('decision_id', decision.id)
          .order('was_selected', { ascending: false })
        if (!cancelled) {
          setAlternatives((data as Alternative[]) ?? [])
          setLoadingAlts(false)
        }
      } catch {
        if (!cancelled) setLoadingAlts(false)
      }
    })()
    return () => { cancelled = true }
  })

  const conf = decision.confidence_at_decision ?? 0
  const acc = decision.accuracy_score ?? null
  const badge = accuracyBadge(acc)
  const hasOutcome = decision.status === 'OUTCOME_KNOWN' || decision.status === 'REVIEWED'

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-800 truncate pr-4">{decision.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(decision.status)}`}
            >
              {decision.status ?? 'UNKNOWN'}
            </span>
            {decision.made_by && (
              <span className="text-xs text-gray-400">by {decision.made_by}</span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Close panel"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* Description */}
        {decision.description && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Decision</p>
            <p className="text-sm text-gray-800 leading-relaxed">{decision.description}</p>
          </div>
        )}

        {/* Context */}
        {decision.context && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Context</p>
            <p className="text-sm text-gray-600 leading-relaxed">{decision.context}</p>
          </div>
        )}

        {/* Status flow */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Status Flow</p>
          <StatusFlowStepper currentStatus={decision.status} />
        </div>

        {/* Key dates */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          {decision.made_at && (
            <div>
              <p className="font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Made at</p>
              <p>{shortDate(decision.made_at)}</p>
            </div>
          )}
          {decision.outcome_due_date && (
            <div>
              <p className="font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Outcome due</p>
              <p>{shortDate(decision.outcome_due_date)}</p>
            </div>
          )}
          {decision.reviewed_at && (
            <div>
              <p className="font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Reviewed</p>
              <p>{relativeTime(decision.reviewed_at)}</p>
            </div>
          )}
        </div>

        {/* Rationale */}
        {decision.decision_rationale && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Rationale</p>
            <p className="text-sm text-gray-600 leading-relaxed">{decision.decision_rationale}</p>
          </div>
        )}

        {/* ── Calibration ── */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Calibration</p>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Confidence at decision</span>
                <span className="tabular-nums font-semibold">{(conf * 100).toFixed(0)}%</span>
              </div>
              <ConfidenceBar score={conf} />
            </div>
            {acc != null ? (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Accuracy score</span>
                  <span className={`tabular-nums font-semibold ${acc >= 0.7 ? 'text-green-700' : acc >= 0.4 ? 'text-amber-700' : 'text-red-600'}`}>
                    {(acc * 100).toFixed(0)}%
                  </span>
                </div>
                <ConfidenceBar score={acc} />
                {decision.calibration_delta != null && (
                  <p className="mt-1.5 text-[10px] text-gray-400">
                    Calibration delta:{' '}
                    <span
                      className={`font-semibold ${
                        Math.abs(decision.calibration_delta) <= 0.1
                          ? 'text-green-600'
                          : Math.abs(decision.calibration_delta) <= 0.25
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {decision.calibration_delta > 0 ? '+' : ''}
                      {(decision.calibration_delta * 100).toFixed(0)}%
                    </span>{' '}
                    ({decision.calibration_delta > 0 ? 'over-confident' : decision.calibration_delta < 0 ? 'under-confident' : 'well calibrated'})
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Accuracy not yet recorded.</p>
            )}
          </div>
        </div>

        {/* ── Alternatives ── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Alternatives ({decision.alternatives_count})
          </p>
          {loadingAlts ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : alternatives.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No alternatives recorded.</p>
          ) : (
            <div className="space-y-2">
              {alternatives.map((alt) => {
                const selected = alt.was_selected ?? alt.id === decision.selected_alternative_id
                return (
                  <div
                    key={alt.id}
                    className={`rounded-lg border px-3 py-3 ${
                      selected ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {selected && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          Selected
                        </span>
                      )}
                      <span className="text-xs font-medium text-gray-800">{alt.title}</span>
                    </div>
                    {alt.description && (
                      <p className="text-xs text-gray-500 mb-1.5 leading-relaxed">{alt.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
                      {alt.expected_value != null && (
                        <span>
                          <span className="text-gray-400">Expected value</span>{' '}
                          <span className="tabular-nums font-semibold text-gray-600">{alt.expected_value.toFixed(2)}</span>
                        </span>
                      )}
                      {alt.probability_of_success != null && (
                        <span>
                          <span className="text-gray-400">P(success)</span>{' '}
                          <span className="tabular-nums font-semibold text-gray-600">
                            {(alt.probability_of_success * 100).toFixed(0)}%
                          </span>
                        </span>
                      )}
                      {alt.outcome_score != null && (
                        <span>
                          <span className="text-gray-400">Outcome</span>{' '}
                          <span
                            className={`tabular-nums font-semibold ${
                              alt.outcome_score >= 0.7
                                ? 'text-green-700'
                                : alt.outcome_score >= 0.4
                                ? 'text-amber-700'
                                : 'text-red-600'
                            }`}
                          >
                            {(alt.outcome_score * 100).toFixed(0)}%
                          </span>
                        </span>
                      )}
                    </div>
                    {alt.rejection_reason && !selected && (
                      <p className="mt-1 text-[10px] text-gray-400 italic">{alt.rejection_reason}</p>
                    )}
                    {alt.outcome_notes && (
                      <p className="mt-1 text-[10px] text-gray-500">{alt.outcome_notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Outcome review ── */}
        {hasOutcome && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Outcome Review</p>

            {decision.actual_outcome && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Actual outcome</p>
                <p className="text-sm text-gray-800 leading-relaxed">{decision.actual_outcome}</p>
              </div>
            )}
            {decision.expected_outcome && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Expected outcome</p>
                <p className="text-sm text-gray-600 leading-relaxed">{decision.expected_outcome}</p>
              </div>
            )}
            {decision.success_criteria && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Success criteria</p>
                <p className="text-sm text-gray-600 leading-relaxed">{decision.success_criteria}</p>
              </div>
            )}
            {decision.lessons_learned && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">Lessons learned</p>
                <p className="text-sm text-gray-600 leading-relaxed">{decision.lessons_learned}</p>
              </div>
            )}
            {badge && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Accuracy:</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}
                >
                  {badge.label} — {((acc ?? 0) * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Linked object */}
        {decision.object_id && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Linked Object</p>
            <span className="inline-block rounded bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs text-gray-600 font-mono">
              {decision.object_id}
            </span>
          </div>
        )}

        {/* Notes */}
        {decision.notes && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-500 leading-relaxed">{decision.notes}</p>
          </div>
        )}

        {/* Provenance */}
        <div className="grid grid-cols-2 gap-4 text-[10px] text-gray-400 pt-2 border-t border-gray-100">
          <div>
            <span className="font-semibold uppercase tracking-wide">Created</span>
            <p>{relativeTime(decision.created_at)}</p>
          </div>
          <div>
            <span className="font-semibold uppercase tracking-wide">Updated</span>
            <p>{relativeTime(decision.updated_at)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Filters ─────────────────────────────────────────────────────────────────

const ALL_FLOW_STATUSES: DecisionStatus[] = [
  'IDENTIFIED',
  'FRAMING',
  'ALTERNATIVES_GENERATED',
  'ANALYZED',
  'RECOMMENDED',
  'MADE',
  'IMPLEMENTING',
  'OUTCOME_KNOWN',
  'REVIEWED',
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DecisionsView({ decisions }: DecisionsViewProps) {
  // Filter state
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [confMin, setConfMin] = useState(0)
  const [confMax, setConfMax] = useState(100)
  const [pendingOutcomeOnly, setPendingOutcomeOnly] = useState(false)

  // Expanded rows for alternatives sub-panel
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Detail panel
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null)

  // ── Metrics ──
  const metrics = useMemo(() => {
    const counts = {
      open: 0,
      under_review: 0,
      made: 0,
      implementing: 0,
      outcome_recorded: 0,
      awaiting_review: 0,
    }
    for (const d of decisions) {
      const s = d.status ?? ''
      if (['IDENTIFIED', 'FRAMING', 'ALTERNATIVES_GENERATED', 'ANALYZED', 'RECOMMENDED'].includes(s)) {
        counts.open++
      }
      if (s === 'REVIEWED') counts.under_review++
      if (s === 'MADE') counts.made++
      if (s === 'IMPLEMENTING') counts.implementing++
      if (s === 'OUTCOME_KNOWN' || s === 'REVIEWED') counts.outcome_recorded++
      if (isAwaitingReview(d)) counts.awaiting_review++
    }
    return counts
  }, [decisions])

  // ── Toggle status chip ──
  const toggleStatus = useCallback((s: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }, [])

  // ── Toggle expanded row ──
  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // ── Filter + sort ──
  const filtered = useMemo(() => {
    let result = decisions

    if (pendingOutcomeOnly) {
      result = result.filter((d) => isAwaitingReview(d))
    } else if (selectedStatuses.length > 0) {
      result = result.filter((d) => selectedStatuses.includes(d.status ?? ''))
    }

    if (dateFrom) {
      result = result.filter((d) => d.made_at && d.made_at >= dateFrom)
    }
    if (dateTo) {
      result = result.filter((d) => d.made_at && d.made_at <= dateTo + 'T23:59:59')
    }

    const minFrac = confMin / 100
    const maxFrac = confMax / 100
    result = result.filter((d) => {
      const c = d.confidence_at_decision ?? 0
      return c >= minFrac && c <= maxFrac
    })

    return result
  }, [decisions, selectedStatuses, dateFrom, dateTo, confMin, confMax, pendingOutcomeOnly])

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Decisions</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Track decisions from identification through outcome review and calibration.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* ── Metrics strip ── */}
        <div className="flex flex-wrap gap-3">
          <MetricCard label="Open" count={metrics.open} colorClass="text-gray-800" />
          <MetricCard label="Under Review" count={metrics.under_review} colorClass="text-indigo-700" />
          <MetricCard label="Made" count={metrics.made} colorClass="text-cyan-700" />
          <MetricCard label="Implementing" count={metrics.implementing} colorClass="text-amber-700" />
          <MetricCard label="Outcome Recorded" count={metrics.outcome_recorded} colorClass="text-green-700" />
          <MetricCard
            label="Awaiting Review"
            count={metrics.awaiting_review}
            colorClass="text-amber-700"
            warning={metrics.awaiting_review > 0}
          />
        </div>

        {/* ── Status Flow (overall) ── */}
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Decision Lifecycle</p>
          <StatusFlowStepper currentStatus={null} />
        </div>

        {/* ── Filter bar ── */}
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 space-y-4">
          {/* Status chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-14 shrink-0">Status</span>
            {ALL_FLOW_STATUSES.map((s) => {
              const active = selectedStatuses.includes(s)
              const label = s.replace('ALTERNATIVES_GENERATED', 'Alt. Gen.').replace(/_/g, ' ')
              return (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all border ${
                    active
                      ? statusBadgeClass(s) + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Date + confidence + toggle row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Date range */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">Made</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <span className="text-xs text-gray-300">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Confidence range */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">Confidence</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={confMin}
                onChange={(e) => setConfMin(Math.min(Number(e.target.value), confMax - 5))}
                className="w-20 accent-indigo-500"
              />
              <span className="text-xs tabular-nums text-gray-500">{confMin}%</span>
              <span className="text-xs text-gray-300">–</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={confMax}
                onChange={(e) => setConfMax(Math.max(Number(e.target.value), confMin + 5))}
                className="w-20 accent-indigo-500"
              />
              <span className="text-xs tabular-nums text-gray-500">{confMax}%</span>
            </div>

            {/* Pending outcome review toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                role="switch"
                aria-checked={pendingOutcomeOnly}
                onClick={() => setPendingOutcomeOnly((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  pendingOutcomeOnly ? 'bg-amber-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    pendingOutcomeOnly ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="text-xs text-gray-600 font-medium">Pending outcome review</span>
            </label>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg
                className="h-10 w-10 text-gray-300 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-sm font-medium text-gray-400">No decisions match the current filters.</p>
              <p className="text-xs text-gray-300 mt-1">Adjust your filters or add a new decision.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="w-8 px-3 py-3" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Title
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell w-32">
                    Confidence
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                    Alternatives
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">
                    Made at
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">
                    Outcome due
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden 2xl:table-cell">
                    Actual outcome
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                    Accuracy
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((decision) => {
                  const expanded = expandedRows.has(decision.id)
                  const awaitingReview = isAwaitingReview(decision)
                  const badge = accuracyBadge(decision.accuracy_score)

                  return (
                    <>
                      <tr
                        key={decision.id}
                        className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                          awaitingReview ? 'border-l-2 border-l-amber-400' : ''
                        } ${expanded ? 'bg-gray-50' : ''}`}
                      >
                        {/* Expand toggle */}
                        <td className="px-3 py-3">
                          <button
                            onClick={() => toggleRow(decision.id)}
                            className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                            aria-label={expanded ? 'Collapse' : 'Expand alternatives'}
                          >
                            <svg
                              className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>

                        {/* Title */}
                        <td
                          className="px-4 py-3 max-w-xs"
                          onClick={() => setSelectedDecision(decision)}
                        >
                          <span className="text-gray-800 font-medium line-clamp-2 leading-snug">
                            {decision.title}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td
                          className="px-3 py-3"
                          onClick={() => setSelectedDecision(decision)}
                        >
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${statusBadgeClass(
                              decision.status
                            )}`}
                          >
                            {(decision.status ?? 'UNKNOWN').replace(/_/g, ' ')}
                          </span>
                        </td>

                        {/* Confidence bar */}
                        <td
                          className="px-3 py-3 hidden lg:table-cell w-32"
                          onClick={() => setSelectedDecision(decision)}
                        >
                          <ConfidenceBar
                            score={decision.confidence_at_decision ?? 0}
                            showLabel
                          />
                        </td>

                        {/* Alternatives count */}
                        <td
                          className="px-3 py-3 text-center hidden sm:table-cell"
                          onClick={() => toggleRow(decision.id)}
                        >
                          <span className="text-xs tabular-nums text-gray-600 font-medium">
                            {decision.alternatives_count}
                          </span>
                        </td>

                        {/* Made at */}
                        <td
                          className="px-3 py-3 hidden xl:table-cell"
                          onClick={() => setSelectedDecision(decision)}
                        >
                          <span className="text-xs text-gray-400">{shortDate(decision.made_at)}</span>
                        </td>

                        {/* Outcome due */}
                        <td
                          className="px-3 py-3 hidden xl:table-cell"
                          onClick={() => setSelectedDecision(decision)}
                        >
                          <span className="text-xs text-gray-400">{shortDate(decision.outcome_due_date)}</span>
                        </td>

                        {/* Actual outcome */}
                        <td
                          className="px-3 py-3 hidden 2xl:table-cell max-w-[180px]"
                          onClick={() => setSelectedDecision(decision)}
                        >
                          {decision.actual_outcome ? (
                            <span
                              className="text-xs text-gray-600 line-clamp-2"
                              title={decision.actual_outcome}
                            >
                              {decision.actual_outcome}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300 italic">—</span>
                          )}
                        </td>

                        {/* Accuracy badge */}
                        <td
                          className="px-3 py-3 hidden lg:table-cell"
                          onClick={() => setSelectedDecision(decision)}
                        >
                          {badge ? (
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded sub-panel row */}
                      {expanded && (
                        <tr key={`${decision.id}-expanded`} className="bg-gray-50">
                          <td colSpan={9} className="border-b border-gray-100">
                            <AlternativesSubPanel
                              decisionId={decision.id}
                              selectedAlternativeId={decision.selected_alternative_id}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Row count */}
        {filtered.length > 0 && (
          <p className="text-xs text-gray-400 text-right">
            Showing {filtered.length} of {decisions.length} decisions
          </p>
        )}
      </div>

      {/* ── Detail slide panel ── */}
      {selectedDecision && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setSelectedDecision(null)}
          />
          <DetailPanel
            decision={selectedDecision}
            onClose={() => setSelectedDecision(null)}
          />
        </>
      )}
    </div>
  )
}
