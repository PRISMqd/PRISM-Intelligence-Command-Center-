'use client'

import { useState, useMemo, useCallback } from 'react'
import { formatDistanceToNow, differenceInDays, parseISO } from 'date-fns'
import ConfidenceBar from '@/components/ui/ConfidenceBar'
import type { ClaimStatus } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Claim {
  id: string
  claim_text: string
  claim_type: string | null
  status: string | null
  confidence_score: number | null
  evidence_count: number | null
  last_reviewed_at: string | null
  created_at: string | null
  updated_at: string | null
}

interface Evidence {
  id: string
  evidence_type: string | null
  quality_score: number | null
  summary: string | null
  source?: { title: string | null } | null
}

interface ClaimsViewProps {
  claims: Claim[]
  statusCounts: Record<string, number>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<string, number> = {
  unsupported: 0,
  contested: 1,
  unknown: 2,
  proposed: 3,
  supported: 4,
  deprecated: 5,
  retracted: 6,
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  supported: 'bg-green-100 text-green-800 border border-green-300',
  unsupported: 'bg-amber-100 text-amber-800 border border-amber-300',
  contested: 'bg-red-100 text-red-800 border border-red-300',
  unknown: 'bg-gray-100 text-gray-600 border border-gray-300',
  deprecated: 'bg-gray-100 text-gray-400 border border-gray-200',
  retracted: 'bg-gray-200 text-gray-500 border border-gray-300',
  proposed: 'bg-blue-100 text-blue-700 border border-blue-300',
}

const ALL_STATUSES: ClaimStatus[] = [
  'supported',
  'unsupported',
  'contested',
  'unknown',
  'proposed',
  'deprecated',
  'retracted',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncate(text: string, max = 80): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

function ageDays(created_at: string | null): number {
  if (!created_at) return 0
  return differenceInDays(new Date(), parseISO(created_at))
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return '—'
  }
}

function isHighRiskRow(claim: Claim): boolean {
  const conf = claim.confidence_score ?? 1
  const status = claim.status ?? ''
  const age = ageDays(claim.created_at)
  return conf < 0.3 && status === 'unsupported' && age > 7
}

function getStatusBadgeClass(status: string | null): string {
  return STATUS_BADGE_STYLES[status ?? 'unknown'] ?? STATUS_BADGE_STYLES.unknown
}

function sortClaims(claims: Claim[]): Claim[] {
  return [...claims].sort((a, b) => {
    const aOrder = STATUS_ORDER[a.status ?? 'unknown'] ?? 99
    const bOrder = STATUS_ORDER[b.status ?? 'unknown'] ?? 99
    if (aOrder !== bOrder) return aOrder - bOrder
    // Within same status, sort by confidence ASC (lower confidence first)
    return (a.confidence_score ?? 0) - (b.confidence_score ?? 0)
  })
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  count,
  colorClass,
}: {
  label: string
  count: number
  colorClass: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-white px-5 py-3 shadow-sm min-w-[100px]">
      <span className={`text-2xl font-bold tabular-nums ${colorClass}`}>{count}</span>
      <span className="mt-0.5 text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
    </div>
  )
}

// ─── Status Chip ─────────────────────────────────────────────────────────────

function StatusChip({
  status,
  active,
  onClick,
}: {
  status: ClaimStatus
  active: boolean
  onClick: () => void
}) {
  const base = getStatusBadgeClass(status)
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition-all border ${
        active
          ? base + ' ring-2 ring-offset-1 ring-current opacity-100'
          : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
      }`}
    >
      {status}
    </button>
  )
}

// ─── Detail Panel ────────────────────────────────────────────────────────────

function DetailPanel({
  claim,
  evidence,
  loadingEvidence,
  onClose,
}: {
  claim: Claim
  evidence: Evidence[]
  loadingEvidence: boolean
  onClose: () => void
}) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h2 className="text-base font-semibold text-gray-800">Claim Detail</h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Close panel"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Claim text */}
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Claim</p>
          <p className="text-sm text-gray-800 leading-relaxed">{claim.claim_text}</p>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2">
          {claim.claim_type && (
            <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700">
              {claim.claim_type}
            </span>
          )}
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(claim.status)}`}
          >
            {claim.status ?? 'unknown'}
          </span>
        </div>

        {/* Confidence */}
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Confidence</p>
          <div className="flex items-center gap-3">
            <ConfidenceBar
              score={claim.confidence_score ?? 0}
              showLabel
              className="flex-1"
            />
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <p className="font-medium text-gray-400 uppercase tracking-wide mb-0.5">Last Reviewed</p>
            <p>{relativeTime(claim.last_reviewed_at)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-400 uppercase tracking-wide mb-0.5">Age</p>
            <p>{ageDays(claim.created_at)} days</p>
          </div>
          <div>
            <p className="font-medium text-gray-400 uppercase tracking-wide mb-0.5">Evidence Count</p>
            <p>{claim.evidence_count ?? 0}</p>
          </div>
        </div>

        {/* Evidence list */}
        <div>
          <p className="text-sm font-medium text-gray-500 mb-3">Evidence</p>
          {loadingEvidence ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : evidence.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No evidence linked to this claim.</p>
          ) : (
            <div className="space-y-2">
              {evidence.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {ev.evidence_type && (
                        <span className="inline-block rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 uppercase tracking-wide mb-1">
                          {ev.evidence_type}
                        </span>
                      )}
                      <p className="text-xs text-gray-700 line-clamp-2">{ev.summary ?? '—'}</p>
                      {ev.source?.title && (
                        <p className="mt-1 text-[10px] text-gray-400 truncate">{ev.source.title}</p>
                      )}
                    </div>
                    {ev.quality_score != null && (
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-500">
                        {(ev.quality_score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-6 py-4">
        <button
          className="w-full rounded-md border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          onClick={() => alert('Add Evidence — coming soon')}
        >
          + Add Evidence
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClaimsView({ claims, statusCounts }: ClaimsViewProps) {
  // Filter state
  const [selectedStatuses, setSelectedStatuses] = useState<ClaimStatus[]>([])
  const [typeFilter, setTypeFilter] = useState('')
  const [confidenceRange, setConfidenceRange] = useState<[number, number]>([0, 100])
  const [unsupportedOnly, setUnsupportedOnly] = useState(false)

  // Detail panel state
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loadingEvidence, setLoadingEvidence] = useState(false)

  // Derived: all unique claim types
  const claimTypes = useMemo(() => {
    const types = new Set<string>()
    for (const c of claims) {
      if (c.claim_type) types.add(c.claim_type)
    }
    return Array.from(types).sort()
  }, [claims])

  // Toggle status chip
  const toggleStatus = useCallback((status: ClaimStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }, [])

  // Apply filters then default sort
  const filtered = useMemo(() => {
    let result = claims

    if (unsupportedOnly) {
      result = result.filter((c) => c.status === 'unsupported')
    } else if (selectedStatuses.length > 0) {
      result = result.filter((c) => selectedStatuses.includes((c.status ?? 'unknown') as ClaimStatus))
    }

    if (typeFilter) {
      result = result.filter((c) => c.claim_type === typeFilter)
    }

    const [minPct, maxPct] = confidenceRange
    result = result.filter((c) => {
      const pct = (c.confidence_score ?? 0) * 100
      return pct >= minPct && pct <= maxPct
    })

    return sortClaims(result)
  }, [claims, selectedStatuses, typeFilter, confidenceRange, unsupportedOnly])

  // Open detail panel and fetch evidence
  const openPanel = useCallback(async (claim: Claim) => {
    setSelectedClaim(claim)
    setEvidence([])
    setLoadingEvidence(true)
    try {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      const { data } = await supabase
        .from('evidence')
        .select(`
          id,
          evidence_type,
          quality_score,
          summary,
          source:sources(title)
        `)
        .eq('claim_id', claim.id)
        .order('quality_score', { ascending: false })
      setEvidence((data as unknown as Evidence[]) ?? [])
    } catch {
      setEvidence([])
    } finally {
      setLoadingEvidence(false)
    }
  }, [])

  const closePanel = useCallback(() => {
    setSelectedClaim(null)
    setEvidence([])
  }, [])

  const total =
    (statusCounts.supported ?? 0) +
    (statusCounts.unsupported ?? 0) +
    (statusCounts.contested ?? 0) +
    (statusCounts.unknown ?? 0)

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Claims</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage and review all claims, their evidence, and epistemic status.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* ── Metrics strip ── */}
        <div className="flex flex-wrap gap-3">
          <MetricCard label="Total" count={total} colorClass="text-gray-800" />
          <MetricCard label="Supported" count={statusCounts.supported ?? 0} colorClass="text-green-700" />
          <MetricCard label="Unsupported" count={statusCounts.unsupported ?? 0} colorClass="text-amber-700" />
          <MetricCard label="Contested" count={statusCounts.contested ?? 0} colorClass="text-red-700" />
          <MetricCard label="Unknown" count={statusCounts.unknown ?? 0} colorClass="text-gray-500" />
        </div>

        {/* ── Filter bar ── */}
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 space-y-4">
          {/* Status chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-16">Status</span>
            {ALL_STATUSES.map((s) => (
              <StatusChip
                key={s}
                status={s}
                active={selectedStatuses.includes(s)}
                onClick={() => toggleStatus(s)}
              />
            ))}
          </div>

          {/* Type + confidence + toggle row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Type filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Type</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">All types</option>
                {claimTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Confidence range */}
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                Confidence
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={confidenceRange[0]}
                onChange={(e) =>
                  setConfidenceRange([Math.min(Number(e.target.value), confidenceRange[1] - 5), confidenceRange[1]])
                }
                className="w-20 accent-indigo-500"
              />
              <span className="text-xs tabular-nums text-gray-500">
                {confidenceRange[0]}%
              </span>
              <span className="text-xs text-gray-300">–</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={confidenceRange[1]}
                onChange={(e) =>
                  setConfidenceRange([confidenceRange[0], Math.max(Number(e.target.value), confidenceRange[0] + 5)])
                }
                className="w-20 accent-indigo-500"
              />
              <span className="text-xs tabular-nums text-gray-500">
                {confidenceRange[1]}%
              </span>
            </div>

            {/* Unsupported only toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                role="switch"
                aria-checked={unsupportedOnly}
                onClick={() => setUnsupportedOnly((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  unsupportedOnly ? 'bg-amber-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    unsupportedOnly ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="text-xs text-gray-600 font-medium">Unsupported only</span>
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-400">No claims match the current filters.</p>
              <p className="text-xs text-gray-300 mt-1">Try adjusting your filters above.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Claim
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Type
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell w-32">
                    Confidence
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                    Evidence
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">
                    Last Reviewed
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">
                    Age
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((claim) => {
                  const highRisk = isHighRiskRow(claim)
                  return (
                    <tr
                      key={claim.id}
                      onClick={() => openPanel(claim)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        highRisk ? 'border-l-2 border-l-red-400' : ''
                      }`}
                    >
                      {/* Claim text */}
                      <td className="px-4 py-3">
                        <span
                          className="text-gray-800 leading-snug"
                          title={claim.claim_text}
                        >
                          {truncate(claim.claim_text)}
                        </span>
                      </td>

                      {/* Type badge */}
                      <td className="px-3 py-3 hidden md:table-cell">
                        {claim.claim_type ? (
                          <span className="inline-block rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-700 whitespace-nowrap">
                            {claim.claim_type}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${getStatusBadgeClass(
                            claim.status
                          )}`}
                        >
                          {claim.status ?? 'unknown'}
                        </span>
                      </td>

                      {/* Confidence bar */}
                      <td className="px-3 py-3 hidden lg:table-cell w-32">
                        <ConfidenceBar
                          score={claim.confidence_score ?? 0}
                          showLabel
                        />
                      </td>

                      {/* Evidence count */}
                      <td className="px-3 py-3 text-center hidden sm:table-cell">
                        <span className="text-xs tabular-nums text-gray-600 font-medium">
                          {claim.evidence_count ?? 0}
                        </span>
                      </td>

                      {/* Last reviewed */}
                      <td className="px-3 py-3 hidden xl:table-cell">
                        <span className="text-xs text-gray-400">
                          {relativeTime(claim.last_reviewed_at)}
                        </span>
                      </td>

                      {/* Age */}
                      <td className="px-3 py-3 text-center hidden xl:table-cell">
                        <span className="text-xs tabular-nums text-gray-400">
                          {ageDays(claim.created_at)}d
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Row count */}
        {filtered.length > 0 && (
          <p className="text-xs text-gray-400 text-right">
            Showing {filtered.length} of {claims.length} claims
          </p>
        )}
      </div>

      {/* ── Detail slide panel ── */}
      {selectedClaim && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={closePanel}
          />
          <DetailPanel
            claim={selectedClaim}
            evidence={evidence}
            loadingEvidence={loadingEvidence}
            onClose={closePanel}
          />
        </>
      )}
    </div>
  )
}
