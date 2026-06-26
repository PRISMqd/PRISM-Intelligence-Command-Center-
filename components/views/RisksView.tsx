'use client'

import { useState, useMemo } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewEntry {
  date: string
  note: string
  reviewer?: string
}

interface Risk {
  id: string
  title: string
  description: string | null
  category: string | null
  likelihood: number | null
  impact: number | null
  risk_score: number | null
  mitigation_status: string | null
  mitigation_plan: string | null
  likelihood_rationale: string | null
  impact_rationale: string | null
  owner: string | null
  linked_objects: string[] | null
  review_history: ReviewEntry[] | null
  last_reviewed_at: string | null
  created_at: string | null
  updated_at: string | null
}

interface RisksViewProps {
  risks: Risk[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MITIGATION_STYLES: Record<string, string> = {
  none: 'bg-red-100 text-red-800 border border-red-300',
  planned: 'bg-amber-100 text-amber-800 border border-amber-300',
  in_progress: 'bg-blue-100 text-blue-800 border border-blue-300',
  mitigated: 'bg-green-100 text-green-800 border border-green-300',
  accepted: 'bg-gray-100 text-gray-600 border border-gray-300',
}

const MITIGATION_LABELS: Record<string, string> = {
  none: 'None',
  planned: 'Planned',
  in_progress: 'In Progress',
  mitigated: 'Mitigated',
  accepted: 'Accepted',
}

const ALL_MITIGATION_STATUSES = ['none', 'planned', 'in_progress', 'mitigated', 'accepted']

const CATEGORY_COLORS: Record<string, string> = {
  financial: '#ef4444',
  operational: '#f97316',
  strategic: '#8b5cf6',
  technical: '#3b82f6',
  legal: '#ec4899',
  market: '#14b8a6',
  regulatory: '#f59e0b',
  reputational: '#6366f1',
  people: '#84cc16',
  default: '#6b7280',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRiskScoreStyle(score: number | null): string {
  if (score == null) return 'bg-gray-100 text-gray-600 border border-gray-300'
  if (score > 0.64) return 'bg-red-600 text-white'
  if (score >= 0.36) return 'bg-amber-500 text-white'
  if (score >= 0.16) return 'bg-blue-500 text-white'
  return 'bg-green-600 text-white'
}

function getRiskLabel(score: number | null): string {
  if (score == null) return '—'
  if (score > 0.64) return 'Critical'
  if (score >= 0.36) return 'High'
  if (score >= 0.16) return 'Medium'
  return 'Low'
}

function getCategoryColor(category: string | null): string {
  if (!category) return CATEGORY_COLORS.default
  return CATEGORY_COLORS[category.toLowerCase()] ?? CATEGORY_COLORS.default
}

function fmt(val: number | null, decimals = 2): string {
  if (val == null) return '—'
  return val.toFixed(decimals)
}

function isCriticalUnmitigated(risk: Risk): boolean {
  return (
    (risk.risk_score ?? 0) > 0.64 &&
    (risk.mitigation_status === 'none' || risk.mitigation_status === 'planned')
  )
}

// ─── Risk Matrix Tooltip ──────────────────────────────────────────────────────

interface MatrixTooltipProps {
  active?: boolean
  payload?: Array<{ payload: Risk & { x: number; y: number } }>
}

function MatrixTooltip({ active, payload }: MatrixTooltipProps) {
  if (!active || !payload?.length) return null
  const risk = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 max-w-[220px]">
      <p className="text-xs font-semibold text-gray-900 leading-snug mb-1">{risk.title}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${getRiskScoreStyle(risk.risk_score)}`}>
          {getRiskLabel(risk.risk_score)} {fmt(risk.risk_score)}
        </span>
        {risk.category && (
          <span
            className="inline-block px-1.5 py-0.5 rounded text-xs font-medium text-white capitalize"
            style={{ backgroundColor: getCategoryColor(risk.category) }}
          >
            {risk.category}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        L: {fmt(risk.likelihood)} | I: {fmt(risk.impact)}
      </p>
    </div>
  )
}

// ─── Risk Detail Panel ────────────────────────────────────────────────────────

interface DetailPanelProps {
  risk: Risk
  onClose: () => void
}

function DetailPanel({ risk, onClose }: DetailPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex-1 pr-4">
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{risk.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {risk.category && (
                <span
                  className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white capitalize"
                  style={{ backgroundColor: getCategoryColor(risk.category) }}
                >
                  {risk.category}
                </span>
              )}
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getRiskScoreStyle(risk.risk_score)}`}>
                {getRiskLabel(risk.risk_score)} — Score {fmt(risk.risk_score)}
              </span>
              {risk.mitigation_status && (
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${MITIGATION_STYLES[risk.mitigation_status] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                  {MITIGATION_LABELS[risk.mitigation_status] ?? risk.mitigation_status}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Scores */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Likelihood', value: fmt(risk.likelihood) },
              { label: 'Impact', value: fmt(risk.impact) },
              { label: 'Risk Score', value: fmt(risk.risk_score) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-gray-900 font-mono">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {risk.description && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</h4>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{risk.description}</p>
            </div>
          )}

          {/* Rationale */}
          {(risk.likelihood_rationale || risk.impact_rationale) && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rationale</h4>
              <div className="space-y-3">
                {risk.likelihood_rationale && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Likelihood Rationale</p>
                    <p className="text-sm text-blue-900">{risk.likelihood_rationale}</p>
                  </div>
                )}
                {risk.impact_rationale && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Impact Rationale</p>
                    <p className="text-sm text-amber-900">{risk.impact_rationale}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mitigation Plan */}
          {risk.mitigation_plan && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mitigation Plan</h4>
              <p className="text-sm text-gray-800 bg-green-50 border border-green-200 rounded p-3 whitespace-pre-wrap">
                {risk.mitigation_plan}
              </p>
            </div>
          )}

          {/* Owner & Dates */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ownership</h4>
            <div className="text-sm text-gray-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Owner</span>
                <span className="font-medium">{risk.owner ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last reviewed</span>
                <span>
                  {risk.last_reviewed_at
                    ? formatDistanceToNow(parseISO(risk.last_reviewed_at), { addSuffix: true })
                    : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span>
                  {risk.created_at
                    ? formatDistanceToNow(parseISO(risk.created_at), { addSuffix: true })
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Objects */}
          {risk.linked_objects && risk.linked_objects.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Linked Objects</h4>
              <div className="flex flex-wrap gap-1.5">
                {risk.linked_objects.map((obj) => (
                  <span
                    key={obj}
                    className="inline-block px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono text-gray-700"
                  >
                    {obj}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Review History */}
          {risk.review_history && risk.review_history.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Review History</h4>
              <div className="space-y-2">
                {risk.review_history.map((entry, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-xs text-gray-400 font-mono flex-shrink-0 pt-0.5 w-24">
                      {entry.date
                        ? formatDistanceToNow(parseISO(entry.date), { addSuffix: true })
                        : '—'}
                    </span>
                    <div className="flex-1">
                      {entry.reviewer && (
                        <span className="font-medium text-gray-700 mr-1">{entry.reviewer}:</span>
                      )}
                      <span className="text-gray-600">{entry.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Risk Matrix ──────────────────────────────────────────────────────────────

interface RiskMatrixProps {
  risks: Risk[]
  onSelect: (risk: Risk) => void
}

function RiskMatrix({ risks, onSelect }: RiskMatrixProps) {
  const data = risks
    .filter((r) => r.likelihood != null && r.impact != null)
    .map((r) => ({ ...r, x: r.likelihood ?? 0, y: r.impact ?? 0 }))

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Risk Matrix</h3>
      <p className="text-xs text-gray-400 mb-4">Likelihood (x-axis) vs Impact (y-axis) — click a dot to view details</p>

      {/* Quadrant labels overlay */}
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none z-10" style={{ top: 10, left: 60, right: 10, bottom: 40 }}>
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            <div className="flex items-start justify-start p-2">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide opacity-60">Medium Risk</span>
            </div>
            <div className="flex items-start justify-end p-2">
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wide opacity-60">Critical Risk</span>
            </div>
            <div className="flex items-end justify-start p-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide opacity-60">Low Risk</span>
            </div>
            <div className="flex items-end justify-end p-2">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide opacity-60">High Risk</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 40, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 1]}
              tickCount={6}
              label={{ value: 'Likelihood', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#6b7280' }}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, 1]}
              tickCount={6}
              label={{ value: 'Impact', angle: -90, position: 'insideLeft', offset: 10, fontSize: 12, fill: '#6b7280' }}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
            />
            <ReferenceLine x={0.5} stroke="#d1d5db" strokeDasharray="4 4" />
            <ReferenceLine y={0.5} stroke="#d1d5db" strokeDasharray="4 4" />
            <Tooltip content={<MatrixTooltip />} />
            <Scatter
              data={data}
              onClick={(dot) => {
                const risk = risks.find((r) => r.id === dot.id)
                if (risk) onSelect(risk)
              }}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={getCategoryColor(entry.category)}
                  opacity={0.85}
                  stroke="white"
                  strokeWidth={1.5}
                  r={8}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap gap-2 mt-2">
        {Array.from(new Set(risks.map((r) => r.category).filter(Boolean))).map((cat) => (
          <span key={cat} className="flex items-center gap-1 text-xs text-gray-500">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: getCategoryColor(cat) }}
            />
            <span className="capitalize">{cat}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function RisksView({ risks: initialRisks }: RisksViewProps) {
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [mitigationFilter, setMitigationFilter] = useState<string[]>([])
  const [ownerFilter, setOwnerFilter] = useState('')
  const [scoreMin, setScoreMin] = useState(0)
  const [scoreMax, setScoreMax] = useState(1)
  const [showCriticalOnly, setShowCriticalOnly] = useState(false)

  // ── Derived ──────────────────────────────────────────────────────────────────

  const criticalUnmitigated = useMemo(
    () => initialRisks.filter(isCriticalUnmitigated),
    [initialRisks]
  )

  const metrics = useMemo(() => {
    const total = initialRisks.length
    const critical = initialRisks.filter((r) => (r.risk_score ?? 0) > 0.64).length
    const high = initialRisks.filter((r) => {
      const s = r.risk_score ?? 0
      return s >= 0.36 && s <= 0.64
    }).length
    const medium = initialRisks.filter((r) => {
      const s = r.risk_score ?? 0
      return s >= 0.16 && s < 0.36
    }).length
    const low = initialRisks.filter((r) => (r.risk_score ?? 0) < 0.16).length
    const mitigated = initialRisks.filter((r) => r.mitigation_status === 'mitigated').length
    return { total, critical, high, medium, low, mitigated }
  }, [initialRisks])

  const allCategories = useMemo(
    () => Array.from(new Set(initialRisks.map((r) => r.category).filter(Boolean))) as string[],
    [initialRisks]
  )

  const allOwners = useMemo(
    () => Array.from(new Set(initialRisks.map((r) => r.owner).filter(Boolean))) as string[],
    [initialRisks]
  )

  const filtered = useMemo(() => {
    return initialRisks.filter((r) => {
      const score = r.risk_score ?? 0
      if (score < scoreMin || score > scoreMax) return false
      if (categoryFilter.length > 0 && !categoryFilter.includes(r.category ?? '')) return false
      if (mitigationFilter.length > 0 && !mitigationFilter.includes(r.mitigation_status ?? '')) return false
      if (ownerFilter && r.owner !== ownerFilter) return false
      if (showCriticalOnly && !isCriticalUnmitigated(r)) return false
      return true
    })
  }, [initialRisks, scoreMin, scoreMax, categoryFilter, mitigationFilter, ownerFilter, showCriticalOnly])

  const toggleFilter = <T,>(arr: T[], val: T, set: (v: T[]) => void) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Detail panel */}
      {selectedRisk && (
        <DetailPanel risk={selectedRisk} onClose={() => setSelectedRisk(null)} />
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* ── Critical alert banner ────────────────────────────────────────── */}
        {criticalUnmitigated.length > 0 && (
          <div className="rounded-lg bg-red-600 text-white px-5 py-4 shadow-md">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">
                  {criticalUnmitigated.length} UNMITIGATED CRITICAL RISK{criticalUnmitigated.length !== 1 ? 'S' : ''} — Immediate Action Required
                </p>
                <ul className="text-sm text-red-100 space-y-0.5">
                  {criticalUnmitigated.map((r) => (
                    <li key={r.id} className="flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-200 flex-shrink-0" />
                      <button
                        onClick={() => setSelectedRisk(r)}
                        className="truncate max-w-[600px] text-left hover:text-white underline underline-offset-2 decoration-red-300"
                      >
                        {r.title}
                      </button>
                      <span className="font-mono text-red-200 text-xs flex-shrink-0">
                        [{fmt(r.risk_score)}] {r.mitigation_status === 'planned' ? 'planned' : 'no mitigation'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 px-6 py-5 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Risk Register</h1>
          <p className="text-sm text-gray-500 mt-1">Risk score = Likelihood × Impact</p>
        </div>

        {/* ── Metrics strip ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {[
            { label: 'Total', value: metrics.total, className: 'text-gray-900' },
            { label: 'Critical >0.64', value: metrics.critical, className: 'text-red-600' },
            { label: 'High 0.36–0.64', value: metrics.high, className: 'text-amber-600' },
            { label: 'Medium 0.16–0.36', value: metrics.medium, className: 'text-blue-600' },
            { label: 'Low <0.16', value: metrics.low, className: 'text-gray-500' },
            { label: 'Mitigated', value: metrics.mitigated, className: 'text-green-600' },
          ].map(({ label, value, className }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm text-center">
              <div className={`text-2xl font-bold ${className}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Risk Matrix ──────────────────────────────────────────────────── */}
        <RiskMatrix risks={initialRisks} onSelect={setSelectedRisk} />

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-4 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-x-6 gap-y-4">

            {/* Category filter */}
            {allCategories.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</p>
                <div className="flex flex-wrap gap-1.5">
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleFilter(categoryFilter, cat, setCategoryFilter)}
                      className="px-2.5 py-1 rounded text-xs font-medium border transition-colors capitalize"
                      style={
                        categoryFilter.includes(cat)
                          ? { backgroundColor: getCategoryColor(cat), color: 'white', borderColor: getCategoryColor(cat) }
                          : { backgroundColor: '#f3f4f6', color: '#6b7280', borderColor: '#e5e7eb' }
                      }
                    >
                      {cat}
                    </button>
                  ))}
                  {categoryFilter.length > 0 && (
                    <button
                      onClick={() => setCategoryFilter([])}
                      className="px-2.5 py-1 rounded text-xs font-medium text-gray-400 border border-dashed border-gray-300 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Mitigation status filter */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mitigation Status</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_MITIGATION_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleFilter(mitigationFilter, s, setMitigationFilter)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      mitigationFilter.includes(s)
                        ? (MITIGATION_STYLES[s] ?? 'bg-gray-200 text-gray-700 border-gray-300')
                        : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {MITIGATION_LABELS[s]}
                  </button>
                ))}
                {mitigationFilter.length > 0 && (
                  <button
                    onClick={() => setMitigationFilter([])}
                    className="px-2.5 py-1 rounded text-xs font-medium text-gray-400 border border-dashed border-gray-300 hover:text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Owner filter */}
            {allOwners.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Owner</p>
                <select
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All owners</option>
                  {allOwners.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Score range */}
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Score range: {scoreMin.toFixed(2)} – {scoreMax.toFixed(2)}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">0</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={scoreMin}
                  onChange={(e) => setScoreMin(Math.min(parseFloat(e.target.value), scoreMax))}
                  className="flex-1 accent-blue-600"
                />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={scoreMax}
                  onChange={(e) => setScoreMax(Math.max(parseFloat(e.target.value), scoreMin))}
                  className="flex-1 accent-blue-600"
                />
                <span className="text-xs text-gray-400">1</span>
              </div>
            </div>

            {/* Critical only toggle */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCriticalOnly}
                  onChange={(e) => setShowCriticalOnly(e.target.checked)}
                  className="w-4 h-4 accent-red-600"
                />
                <span className="text-xs font-medium text-red-700">Unmitigated Critical Only</span>
              </label>
            </div>
          </div>

          {filtered.length !== initialRisks.length && (
            <p className="text-xs text-gray-500">
              Showing {filtered.length} of {initialRisks.length} risks
            </p>
          )}
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Likelihood</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Impact</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Score</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Mitigation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Reviewed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                      No risks match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((risk) => {
                    const score = risk.risk_score ?? 0
                    const isCritical = score > 0.64
                    return (
                      <tr
                        key={risk.id}
                        onClick={() => setSelectedRisk(risk)}
                        className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                          isCritical && isCriticalUnmitigated(risk)
                            ? 'border-l-4 border-l-red-500'
                            : isCritical
                            ? 'border-l-4 border-l-red-200'
                            : ''
                        }`}
                      >
                        {/* Risk name */}
                        <td className="px-4 py-3 max-w-[240px]">
                          <span className="text-gray-900 font-medium leading-snug line-clamp-2">{risk.title}</span>
                        </td>

                        {/* Category badge */}
                        <td className="px-4 py-3">
                          {risk.category ? (
                            <span
                              className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white capitalize"
                              style={{ backgroundColor: getCategoryColor(risk.category) }}
                            >
                              {risk.category}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Likelihood */}
                        <td className="px-4 py-3 text-center font-mono text-xs text-gray-700">
                          {fmt(risk.likelihood)}
                        </td>

                        {/* Impact */}
                        <td className="px-4 py-3 text-center font-mono text-xs text-gray-700">
                          {fmt(risk.impact)}
                        </td>

                        {/* Risk score badge */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-md font-bold text-xs font-mono ${getRiskScoreStyle(risk.risk_score)}`}>
                            {fmt(risk.risk_score)} <span className="font-sans font-normal opacity-80">{getRiskLabel(risk.risk_score)}</span>
                          </span>
                        </td>

                        {/* Mitigation status */}
                        <td className="px-4 py-3 text-center">
                          {risk.mitigation_status ? (
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${MITIGATION_STYLES[risk.mitigation_status] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                              {MITIGATION_LABELS[risk.mitigation_status] ?? risk.mitigation_status}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Owner */}
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {risk.owner ?? <span className="text-gray-400">—</span>}
                        </td>

                        {/* Last reviewed */}
                        <td className="px-4 py-3 text-center text-xs text-gray-500">
                          {risk.last_reviewed_at
                            ? formatDistanceToNow(parseISO(risk.last_reviewed_at), { addSuffix: true })
                            : <span className="text-gray-300">Never</span>}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            {filtered.length} risk{filtered.length !== 1 ? 's' : ''} displayed · Click any row to view details
          </div>
        </div>
      </div>
    </div>
  )
}
