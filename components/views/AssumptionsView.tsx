'use client'

import { useState, useMemo, useCallback } from 'react'
import { differenceInDays, parseISO, formatDistanceToNow } from 'date-fns'
import type { AssumptionStatus } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Assumption {
  id: string
  object_id: string | null
  assumption_text: string
  status: string | null
  importance: number | null
  risk_if_false: number | null
  confidence_gap: number | null
  dependency_count: number | null
  time_since_review: number | null
  assumption_risk_score: number | null
  current_confidence: number | null
  last_reviewed_at: string | null
  review_due_at: string | null
  category: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

interface AssumptionsViewProps {
  assumptions: Assumption[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_STATUSES: AssumptionStatus[] = [
  'active',
  'validated',
  'invalidated',
  'superseded',
  'deferred',
  'accepted_permanent',
]

const STATUS_BADGE_STYLES: Record<string, string> = {
  active: 'bg-blue-100 text-blue-800 border border-blue-300',
  validated: 'bg-green-100 text-green-800 border border-green-300',
  invalidated: 'bg-red-100 text-red-800 border border-red-300',
  superseded: 'bg-gray-100 text-gray-500 border border-gray-300',
  deferred: 'bg-amber-100 text-amber-800 border border-amber-300',
  accepted_permanent: 'bg-purple-100 text-purple-800 border border-purple-300',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRiskColor(score: number | null): string {
  if (score == null) return 'bg-gray-200 text-gray-600'
  if (score > 0.7) return 'bg-red-600 text-white'
  if (score >= 0.4) return 'bg-amber-500 text-white'
  return 'bg-green-600 text-white'
}

function getRiskLabel(score: number | null): string {
  if (score == null) return '—'
  return score.toFixed(3)
}

function getDaysSinceReview(lastReviewedAt: string | null): number | null {
  if (!lastReviewedAt) return null
  try {
    return differenceInDays(new Date(), parseISO(lastReviewedAt))
  } catch {
    return null
  }
}

function fmt(val: number | null, decimals = 2): string {
  if (val == null) return '—'
  return val.toFixed(decimals)
}

// ─── Impact Warning Modal ─────────────────────────────────────────────────────

interface ImpactModalProps {
  assumption: Assumption
  onConfirm: () => void
  onCancel: () => void
}

function ImpactModal({ assumption, onConfirm, onCancel }: ImpactModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Invalidate Assumption</h3>
            <p className="text-sm text-red-600 font-medium">High Impact Warning</p>
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-3">
          You are about to invalidate the following assumption:
        </p>
        <blockquote className="border-l-4 border-red-400 pl-3 py-1 bg-red-50 text-sm text-gray-800 italic mb-4 rounded-r">
          {assumption.assumption_text}
        </blockquote>

        {(assumption.dependency_count ?? 0) > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded p-3 mb-4 text-sm text-amber-900">
            <strong>{assumption.dependency_count} dependent object{assumption.dependency_count !== 1 ? 's' : ''}</strong> may be affected.
            Review and update downstream dependencies after invalidation.
          </div>
        )}

        {(assumption.assumption_risk_score ?? 0) > 0.7 && (
          <div className="bg-red-50 border border-red-300 rounded p-3 mb-4 text-sm text-red-900">
            This is a <strong>high-risk assumption</strong> (score: {fmt(assumption.assumption_risk_score, 3)}).
            Invalidation may have significant downstream consequences.
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Confirm Invalidate
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Expanded Row ─────────────────────────────────────────────────────────────

interface ExpandedRowProps {
  assumption: Assumption
  onMarkReviewed: (id: string) => void
  onValidate: (id: string) => void
  onInvalidate: (id: string) => void
  actionLoading: string | null
}

function ExpandedRow({ assumption, onMarkReviewed, onValidate, onInvalidate, actionLoading }: ExpandedRowProps) {
  const daysSince = getDaysSinceReview(assumption.last_reviewed_at)
  const isLoading = actionLoading === assumption.id

  return (
    <div className="px-6 py-5 bg-gray-50 border-t border-gray-200 space-y-5">
      {/* Full text */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Assumption Text</h4>
        <p className="text-sm text-gray-800 leading-relaxed">{assumption.assumption_text}</p>
      </div>

      {/* Factor grid */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Risk Factors</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Importance', value: fmt(assumption.importance) },
            { label: 'Risk if False', value: fmt(assumption.risk_if_false) },
            { label: 'Confidence Gap', value: fmt(assumption.confidence_gap) },
            { label: 'Dependency Count', value: assumption.dependency_count ?? '—' },
            { label: 'Time Since Review', value: assumption.time_since_review != null ? `${assumption.time_since_review}d` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded border border-gray-200 p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Review History</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Last reviewed:</span>
              <span>
                {assumption.last_reviewed_at
                  ? `${formatDistanceToNow(parseISO(assumption.last_reviewed_at))} ago`
                  : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Days since review:</span>
              <span className={daysSince != null && daysSince > 14 ? 'text-amber-600 font-medium' : ''}>
                {daysSince != null ? `${daysSince}d` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Review due:</span>
              <span>
                {assumption.review_due_at
                  ? formatDistanceToNow(parseISO(assumption.review_due_at), { addSuffix: true })
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created:</span>
              <span>
                {assumption.created_at
                  ? formatDistanceToNow(parseISO(assumption.created_at), { addSuffix: true })
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Dependent Objects</h4>
          {(assumption.dependency_count ?? 0) > 0 ? (
            <div className="text-sm text-gray-700">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-amber-800">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {assumption.dependency_count} dependent object{assumption.dependency_count !== 1 ? 's' : ''} linked
              </span>
              <p className="text-xs text-gray-500 mt-1.5">
                Object IDs linked via object_id: <code className="bg-gray-100 px-1 rounded">{assumption.object_id ?? 'none'}</code>
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No dependent objects recorded.</p>
          )}
        </div>
      </div>

      {/* Notes */}
      {assumption.notes && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</h4>
          <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded p-3 whitespace-pre-wrap">{assumption.notes}</p>
        </div>
      )}

      {/* Category / Current confidence */}
      <div className="flex flex-wrap gap-4 text-sm">
        {assumption.category && (
          <div>
            <span className="text-gray-500">Category: </span>
            <span className="font-medium text-gray-800 capitalize">{assumption.category}</span>
          </div>
        )}
        {assumption.current_confidence != null && (
          <div>
            <span className="text-gray-500">Current confidence: </span>
            <span className="font-medium text-gray-800">{(assumption.current_confidence * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-200">
        <button
          onClick={() => onMarkReviewed(assumption.id)}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Saving…' : 'Mark Reviewed'}
        </button>
        <button
          onClick={() => onValidate(assumption.id)}
          disabled={isLoading || assumption.status === 'validated'}
          className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-300 rounded hover:bg-green-100 disabled:opacity-50 transition-colors"
        >
          Validate
        </button>
        <button
          onClick={() => onInvalidate(assumption.id)}
          disabled={isLoading || assumption.status === 'invalidated'}
          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-300 rounded hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          Invalidate
        </button>
      </div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function AssumptionsView({ assumptions: initialAssumptions }: AssumptionsViewProps) {
  const [assumptions, setAssumptions] = useState<Assumption[]>(initialAssumptions)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 1])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [invalidateTarget, setInvalidateTarget] = useState<Assumption | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ── Derived metrics ──────────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const active = assumptions.filter((a) => a.status !== 'invalidated' && a.status !== 'superseded')
    const high = active.filter((a) => (a.assumption_risk_score ?? 0) > 0.7)
    const medium = active.filter((a) => {
      const s = a.assumption_risk_score ?? 0
      return s >= 0.4 && s <= 0.7
    })
    const low = active.filter((a) => (a.assumption_risk_score ?? 0) < 0.4)
    const stale = assumptions.filter((a) => {
      const d = getDaysSinceReview(a.last_reviewed_at)
      return d != null && d > 14
    })
    return { total: active.length, high: high.length, medium: medium.length, low: low.length, stale: stale.length }
  }, [assumptions])

  const criticalAssumptions = useMemo(
    () => assumptions.filter((a) => (a.assumption_risk_score ?? 0) > 0.9),
    [assumptions]
  )

  // ── Filtered & sorted list ────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return assumptions.filter((a) => {
      const score = a.assumption_risk_score ?? 0
      if (score < scoreRange[0] || score > scoreRange[1]) return false
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(a.status ?? '')) return false
      return true
    })
  }, [assumptions, scoreRange, selectedStatuses])

  // ── Actions ───────────────────────────────────────────────────────────────────

  const patchAssumption = useCallback(async (id: string, body: Record<string, unknown>) => {
    setActionLoading(id)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/assumptions/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...body }),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated: Assumption = await res.json()
      setAssumptions((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)))
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Action failed.')
    } finally {
      setActionLoading(null)
    }
  }, [])

  const handleMarkReviewed = useCallback(
    (id: string) => patchAssumption(id, { action: 'review' }),
    [patchAssumption]
  )

  const handleValidate = useCallback(
    (id: string) => patchAssumption(id, { action: 'validate', status: 'validated' }),
    [patchAssumption]
  )

  const handleInvalidateConfirmed = useCallback(async () => {
    if (!invalidateTarget) return
    const id = invalidateTarget.id
    setInvalidateTarget(null)
    await patchAssumption(id, { action: 'invalidate', status: 'invalidated' })
  }, [invalidateTarget, patchAssumption])

  const handleInvalidate = useCallback(
    (id: string) => {
      const a = assumptions.find((x) => x.id === id) ?? null
      setInvalidateTarget(a)
    },
    [assumptions]
  )

  const toggleStatus = (s: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Impact warning modal */}
      {invalidateTarget && (
        <ImpactModal
          assumption={invalidateTarget}
          onConfirm={handleInvalidateConfirmed}
          onCancel={() => setInvalidateTarget(null)}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* ── Critical alert banner ────────────────────────────────────────── */}
        {criticalAssumptions.length > 0 && (
          <div className="rounded-lg bg-red-600 text-white px-5 py-4 shadow-md">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="font-semibold text-sm mb-1">
                  {criticalAssumptions.length} CRITICAL ASSUMPTION{criticalAssumptions.length > 1 ? 'S' : ''} — Risk Score &gt; 0.9
                </p>
                <ul className="text-sm text-red-100 space-y-0.5">
                  {criticalAssumptions.map((a) => (
                    <li key={a.id} className="flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-200 flex-shrink-0" />
                      <span className="truncate max-w-[600px]">{a.assumption_text}</span>
                      <span className="font-mono text-red-200 text-xs flex-shrink-0">[{fmt(a.assumption_risk_score, 3)}]</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 px-6 py-5 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Assumption Risk Register</h1>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono bg-gray-50 border border-gray-200 rounded px-3 py-2 mt-2 w-fit">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 7h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" />
            </svg>
            Risk = importance × risk_if_false × confidence_gap × dependency_count × time_since_review
          </div>
        </div>

        {/* ── Metrics strip ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total Active', value: metrics.total, className: 'text-gray-900' },
            { label: 'High Risk >0.7', value: metrics.high, className: 'text-red-600' },
            { label: 'Medium 0.4–0.7', value: metrics.medium, className: 'text-amber-600' },
            { label: 'Low <0.4', value: metrics.low, className: 'text-green-700' },
            { label: 'Stale >14 days', value: metrics.stale, className: 'text-amber-700' },
          ].map(({ label, value, className }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm text-center">
              <div className={`text-2xl font-bold ${className}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-4 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status filter */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Filter by status</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors capitalize ${
                      selectedStatuses.includes(s)
                        ? (STATUS_BADGE_STYLES[s] ?? 'bg-gray-200 text-gray-700 border-gray-300')
                        : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
                {selectedStatuses.length > 0 && (
                  <button
                    onClick={() => setSelectedStatuses([])}
                    className="px-2.5 py-1 rounded text-xs font-medium text-gray-400 border border-dashed border-gray-300 hover:text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Score range slider */}
            <div className="flex-1 min-w-[220px]">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Score range: {scoreRange[0].toFixed(1)} – {scoreRange[1].toFixed(1)}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">0</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={scoreRange[0]}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    setScoreRange([Math.min(v, scoreRange[1]), scoreRange[1]])
                  }}
                  className="flex-1 accent-blue-600"
                />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={scoreRange[1]}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    setScoreRange([scoreRange[0], Math.max(v, scoreRange[0])])
                  }}
                  className="flex-1 accent-blue-600"
                />
                <span className="text-xs text-gray-400">1</span>
              </div>
            </div>
          </div>
          {filtered.length !== assumptions.length && (
            <p className="text-xs text-gray-500">
              Showing {filtered.length} of {assumptions.length} assumptions
            </p>
          )}
        </div>

        {/* ── Error message ────────────────────────────────────────────────── */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-300 text-red-800 text-sm rounded px-4 py-3">
            {errorMsg}
          </div>
        )}

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Assumption
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Importance
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Risk if False
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Conf. Gap
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Deps
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Days Since Review
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                      No assumptions match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => {
                    const daysSince = getDaysSinceReview(a.last_reviewed_at)
                    const isExpanded = expandedId === a.id
                    const riskColor = getRiskColor(a.assumption_risk_score)

                    return (
                      <>
                        <tr
                          key={a.id}
                          onClick={() => setExpandedId(isExpanded ? null : a.id)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded
                              ? 'bg-blue-50'
                              : 'hover:bg-gray-50'
                          } ${(a.assumption_risk_score ?? 0) > 0.9 ? 'border-l-4 border-l-red-500' : ''}`}
                        >
                          {/* Assumption text */}
                          <td className="px-4 py-3 max-w-[280px]">
                            <div className="flex items-center gap-2">
                              <svg
                                className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="text-gray-800 leading-snug line-clamp-2">
                                {a.assumption_text.length > 100
                                  ? a.assumption_text.slice(0, 100) + '…'
                                  : a.assumption_text}
                              </span>
                            </div>
                          </td>

                          {/* Risk score badge */}
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-md font-bold text-sm font-mono ${riskColor}`}>
                              {getRiskLabel(a.assumption_risk_score)}
                            </span>
                          </td>

                          {/* Importance */}
                          <td className="px-4 py-3 text-center text-gray-700 font-mono text-xs">
                            {fmt(a.importance)}
                          </td>

                          {/* Risk if false */}
                          <td className="px-4 py-3 text-center text-gray-700 font-mono text-xs">
                            {fmt(a.risk_if_false)}
                          </td>

                          {/* Confidence gap */}
                          <td className="px-4 py-3 text-center text-gray-700 font-mono text-xs">
                            {fmt(a.confidence_gap)}
                          </td>

                          {/* Dependency count */}
                          <td className="px-4 py-3 text-center">
                            <span className={`font-mono text-xs ${(a.dependency_count ?? 0) > 0 ? 'text-amber-700 font-semibold' : 'text-gray-400'}`}>
                              {a.dependency_count ?? 0}
                            </span>
                          </td>

                          {/* Days since review */}
                          <td className="px-4 py-3 text-center">
                            {daysSince != null ? (
                              <span className={`font-mono text-xs font-medium ${daysSince > 14 ? 'text-amber-600' : 'text-gray-600'}`}>
                                {daysSince}d{daysSince > 14 ? ' ⚠' : ''}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>

                          {/* Status badge */}
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                STATUS_BADGE_STYLES[a.status ?? ''] ?? 'bg-gray-100 text-gray-500 border border-gray-200'
                              }`}
                            >
                              {(a.status ?? 'unknown').replace('_', ' ')}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {isExpanded && (
                          <tr key={`${a.id}-expanded`}>
                            <td colSpan={8} className="p-0">
                              <ExpandedRow
                                assumption={a}
                                onMarkReviewed={handleMarkReviewed}
                                onValidate={handleValidate}
                                onInvalidate={handleInvalidate}
                                actionLoading={actionLoading}
                              />
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            {filtered.length} assumption{filtered.length !== 1 ? 's' : ''} displayed · Click any row to expand details
          </div>
        </div>
      </div>
    </div>
  )
}
