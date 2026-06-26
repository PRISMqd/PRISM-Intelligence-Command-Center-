'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Microscope, X, ChevronRight, ExternalLink,
  Calendar, BookOpen, Shield, FileCheck, FlaskConical,
  BarChart2, ClipboardList, Search, SlidersHorizontal,
  CheckCircle2, AlertCircle, AlertTriangle,
} from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

// ─── Types ───────────────────────────────────────────────────────────────────

type SourceRow = {
  id: string
  title: string | null
  source_type: string | null
  publication: string | null
  url: string | null
  authors: string[] | null
  doi: string | null
  publication_date: string | null
  reliability_score: number | null
  peer_reviewed: boolean | null
}

type EvidenceRow = {
  id: string
  claim_id: string | null
  source_id: string | null
  object_id: string | null
  evidence_type: string | null
  summary: string | null
  content: string | null
  excerpt: string | null
  supports_claim: boolean | null
  quality_scores: Record<string, number> | null
  quality_score: number | null
  data_collection_date: string | null
  collected_at: string | null
  last_verified_at: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
  sources: SourceRow | null
}

type FreshnessCategory = 'fresh' | 'stale' | 'very-stale'

interface Props {
  evidence: EvidenceRow[]
  claimCountMap: Record<string, number>
  staleCount: number
  veryStaleCount: number
  avgQuality: number | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

const QUALITY_DIMENSIONS = [
  { key: 'internal_validity', label: 'Internal Validity' },
  { key: 'external_validity', label: 'External Validity' },
  { key: 'reliability', label: 'Reliability' },
  { key: 'precision', label: 'Precision' },
  { key: 'objectivity', label: 'Objectivity' },
  { key: 'independence', label: 'Independence' },
  { key: 'sample_size', label: 'Sample Size' },
  { key: 'methodology_rigor', label: 'Methodology Rigor' },
  { key: 'peer_review', label: 'Peer Review' },
  { key: 'recency', label: 'Recency' },
]

const EVIDENCE_TYPE_COLORS: Record<string, string> = {
  quantitative: 'bg-blue-100 text-blue-800',
  qualitative: 'bg-purple-100 text-purple-800',
  anecdotal: 'bg-gray-100 text-gray-600',
  experimental: 'bg-green-100 text-green-800',
  observational: 'bg-amber-100 text-amber-800',
  meta_analysis: 'bg-indigo-100 text-indigo-800',
  case_study: 'bg-pink-100 text-pink-800',
  expert_opinion: 'bg-orange-100 text-orange-800',
  survey: 'bg-teal-100 text-teal-800',
  document_review: 'bg-slate-100 text-slate-700',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MS_30 = 30 * 24 * 60 * 60 * 1000
const MS_90 = 90 * 24 * 60 * 60 * 1000

function getFreshness(ev: EvidenceRow): { category: FreshnessCategory; ageMs: number; label: string } {
  const dateStr = ev.data_collection_date ?? ev.collected_at ?? ev.created_at
  if (!dateStr) return { category: 'very-stale', ageMs: Infinity, label: 'Unknown' }
  const ageMs = Date.now() - new Date(dateStr).getTime()
  if (ageMs > MS_90) return { category: 'very-stale', ageMs, label: 'Very Stale' }
  if (ageMs > MS_30) return { category: 'stale', ageMs, label: 'Stale' }
  return { category: 'fresh', ageMs, label: 'Fresh' }
}

function formatDaysAgo(ageMs: number): string {
  if (!isFinite(ageMs)) return 'Unknown'
  const days = Math.floor(ageMs / (24 * 60 * 60 * 1000))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function truncate(str: string | null, len: number): string {
  if (!str) return '—'
  return str.length > len ? str.slice(0, len) + '…' : str
}

// ─── Freshness Dot ────────────────────────────────────────────────────────────

function FreshnessDot({ category, label }: { category: FreshnessCategory; label: string }) {
  const colors: Record<FreshnessCategory, string> = {
    fresh: 'bg-green-500',
    stale: 'bg-amber-400',
    'very-stale': 'bg-red-500',
  }
  const text: Record<FreshnessCategory, string> = {
    fresh: 'text-green-700',
    stale: 'text-amber-700',
    'very-stale': 'text-red-700',
  }
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block w-2 h-2 rounded-full ${colors[category]}`} />
      <span className={`text-xs font-medium ${text[category]}`}>{label}</span>
    </span>
  )
}

// ─── Evidence Type Badge ──────────────────────────────────────────────────────

function EvidenceTypeBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-xs text-gray-400">—</span>
  const cls = EVIDENCE_TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600'
  const label = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

// ─── Quality Score Cell with Tooltip ─────────────────────────────────────────

function QualityScoreCell({ score, scores }: { score: number | null; scores: Record<string, number> | null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const display = score != null ? score.toFixed(2) : '—'
  const color =
    score == null ? 'text-gray-400'
    : score >= 0.7 ? 'text-green-700'
    : score >= 0.4 ? 'text-amber-700'
    : 'text-red-700'

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        className={`font-mono text-sm font-semibold ${color} hover:underline focus:outline-none`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
      >
        {display}
      </button>

      {open && scores && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg border border-gray-200 bg-white shadow-xl p-3"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quality Dimensions</p>
          <div className="space-y-1.5">
            {QUALITY_DIMENSIONS.map(({ key, label }) => {
              const val = scores[key] ?? null
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                    <span>{label}</span>
                    <span className="font-mono">{val != null ? val.toFixed(2) : '—'}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full bg-blue-500 transition-all"
                      style={{ width: val != null ? `${Math.min(val * 100, 100)}%` : '0%' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200" />
        </div>
      )}
    </div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function EvidenceDetailPanel({
  ev,
  claimCount,
  onClose,
}: {
  ev: EvidenceRow
  claimCount: number
  onClose: () => void
}) {
  const freshness = getFreshness(ev)
  const scores = ev.quality_scores as Record<string, number> | null

  return (
    <div className="fixed inset-0 z-40 flex justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 pointer-events-auto"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative pointer-events-auto w-full max-w-lg h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Microscope size={16} className="text-[#1F4E79]" />
            <span className="text-sm font-semibold text-gray-800">Evidence Detail</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Type + Freshness */}
          <div className="flex items-center gap-3 flex-wrap">
            <EvidenceTypeBadge type={ev.evidence_type} />
            <FreshnessDot category={freshness.category} label={freshness.label} />
            {ev.supports_claim != null && (
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                ev.supports_claim
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {ev.supports_claim ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                {ev.supports_claim ? 'Supports' : 'Contradicts'}
              </span>
            )}
          </div>

          {/* Summary */}
          {ev.summary && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Summary</p>
              <p className="text-sm text-gray-700 leading-relaxed">{ev.summary}</p>
            </div>
          )}

          {/* Full Content */}
          {ev.content && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Full Content</p>
              <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-md p-3 border border-gray-100 max-h-40 overflow-y-auto">
                {ev.content}
              </div>
            </div>
          )}

          {/* Excerpt */}
          {ev.excerpt && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Excerpt</p>
              <blockquote className="border-l-2 border-blue-300 pl-3 italic text-sm text-gray-600">
                {ev.excerpt}
              </blockquote>
            </div>
          )}

          {/* Quality Scores */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Quality Scores</p>
              {ev.quality_score != null && (
                <span className="text-sm font-bold font-mono text-gray-800">
                  Overall: {ev.quality_score.toFixed(2)}
                </span>
              )}
            </div>
            {scores ? (
              <div className="space-y-2">
                {QUALITY_DIMENSIONS.map(({ key, label }) => {
                  const val = scores[key] ?? null
                  const pct = val != null ? Math.min(val * 100, 100) : 0
                  const barColor =
                    val == null ? 'bg-gray-200'
                    : val >= 0.7 ? 'bg-green-500'
                    : val >= 0.4 ? 'bg-amber-400'
                    : 'bg-red-400'
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-36 text-xs text-gray-600 truncate flex-shrink-0">{label}</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-100">
                        <div
                          className={`h-2 rounded-full transition-all ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-mono text-gray-500">
                        {val != null ? val.toFixed(2) : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No sub-dimension scores available.</p>
            )}
          </div>

          {/* Linked Claims */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Linked Claims</p>
            <div className="flex items-center gap-2">
              <FileCheck size={14} className="text-gray-400" />
              <span className="text-sm text-gray-700">
                {claimCount > 0
                  ? `${claimCount} linked claim${claimCount > 1 ? 's' : ''}`
                  : 'No linked claims'}
              </span>
            </div>
            {ev.claim_id && (
              <p className="text-xs text-gray-400 mt-1 font-mono">Claim ID: {ev.claim_id}</p>
            )}
          </div>

          {/* Source Details */}
          {ev.sources && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Source Details</p>
              <div className="rounded-md border border-gray-100 bg-gray-50 p-3 space-y-1.5">
                {ev.sources.title && (
                  <p className="text-sm font-medium text-gray-800">{ev.sources.title}</p>
                )}
                {ev.sources.authors && ev.sources.authors.length > 0 && (
                  <p className="text-xs text-gray-500">By {ev.sources.authors.join(', ')}</p>
                )}
                {ev.sources.publication && (
                  <p className="text-xs text-gray-500">{ev.sources.publication}</p>
                )}
                {ev.sources.publication_date && (
                  <p className="text-xs text-gray-400">{formatDate(ev.sources.publication_date)}</p>
                )}
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  {ev.sources.source_type && (
                    <span className="text-xs bg-gray-200 text-gray-600 rounded px-1.5 py-0.5 capitalize">
                      {ev.sources.source_type.replace(/_/g, ' ')}
                    </span>
                  )}
                  {ev.sources.peer_reviewed && (
                    <span className="text-xs text-green-700 font-medium flex items-center gap-0.5">
                      <Shield size={10} /> Peer Reviewed
                    </span>
                  )}
                  {ev.sources.reliability_score != null && (
                    <span className="text-xs text-gray-500">
                      Reliability: <span className="font-mono">{ev.sources.reliability_score.toFixed(2)}</span>
                    </span>
                  )}
                </div>
                {ev.sources.url && (
                  <a
                    href={ev.sources.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                  >
                    <ExternalLink size={10} /> View Source
                  </a>
                )}
                {ev.sources.doi && (
                  <p className="text-xs text-gray-400 font-mono">DOI: {ev.sources.doi}</p>
                )}
              </div>
            </div>
          )}

          {/* Provenance Trail */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Provenance Trail</p>
            <div className="space-y-2 border-l-2 border-gray-100 pl-3">
              {ev.created_at && (
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-600">Evidence created</p>
                    <p className="text-xs text-gray-400">{formatDate(ev.created_at)}</p>
                  </div>
                </div>
              )}
              {(ev.data_collection_date ?? ev.collected_at) && (
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-600">Data collected</p>
                    <p className="text-xs text-gray-400">{formatDate(ev.data_collection_date ?? ev.collected_at)}</p>
                  </div>
                </div>
              )}
              {ev.last_verified_at && (
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-600">Last verified</p>
                    <p className="text-xs text-gray-400">{formatDate(ev.last_verified_at)}</p>
                  </div>
                </div>
              )}
              {ev.updated_at && ev.updated_at !== ev.created_at && (
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-600">Last updated</p>
                    <p className="text-xs text-gray-400">{formatDate(ev.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {ev.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-600 italic">{ev.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function EvidenceView({
  evidence,
  claimCountMap,
  staleCount,
  veryStaleCount,
  avgQuality,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [qualityMin, setQualityMin] = useState(0)
  const [qualityMax, setQualityMax] = useState(1)
  const [freshnessFilter, setFreshnessFilter] = useState<'all' | 'fresh' | 'stale' | 'very-stale'>('all')
  const [staleOnly, setStaleOnly] = useState(false)
  const [search, setSearch] = useState('')

  const evidenceTypes = useMemo(() => {
    const set = new Set<string>()
    for (const ev of evidence) {
      if (ev.evidence_type) set.add(ev.evidence_type)
    }
    return Array.from(set).sort()
  }, [evidence])

  const filtered = useMemo(() => {
    return evidence.filter(ev => {
      if (typeFilter !== 'all' && ev.evidence_type !== typeFilter) return false

      const qs = ev.quality_score
      if (qs != null && (qs < qualityMin || qs > qualityMax)) return false

      const freshness = getFreshness(ev)
      if (freshnessFilter !== 'all' && freshness.category !== freshnessFilter) return false
      if (staleOnly && freshness.category === 'fresh') return false

      if (search.trim()) {
        const q = search.toLowerCase()
        const inSummary = ev.summary?.toLowerCase().includes(q) ?? false
        const inSource = ev.sources?.title?.toLowerCase().includes(q) ?? false
        const inContent = ev.content?.toLowerCase().includes(q) ?? false
        if (!inSummary && !inSource && !inContent) return false
      }

      return true
    })
  }, [evidence, typeFilter, qualityMin, qualityMax, freshnessFilter, staleOnly, search])

  const selectedEv = useMemo(
    () => evidence.find(e => e.id === selectedId) ?? null,
    [evidence, selectedId]
  )

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#F8F9FA]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Microscope size={20} className="text-[#1F4E79]" />
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Evidence</h1>
          <span className="text-sm text-gray-400 font-medium">{evidence.length} items</span>
        </div>

        {/* Metric chips */}
        <div className="flex flex-wrap gap-3">
          <MetricChip
            label="Total"
            value={evidence.length}
            color="text-gray-800"
            icon={<ClipboardList size={13} />}
          />
          <MetricChip
            label="Stale >30d"
            value={staleCount}
            color="text-amber-700"
            bg="bg-amber-50 border-amber-200"
            icon={<AlertTriangle size={13} className="text-amber-500" />}
          />
          <MetricChip
            label="Very Stale >90d"
            value={veryStaleCount}
            color="text-red-700"
            bg="bg-red-50 border-red-200"
            icon={<AlertCircle size={13} className="text-red-500" />}
          />
          <MetricChip
            label="Avg Quality"
            value={avgQuality != null ? avgQuality.toFixed(2) : '—'}
            color="text-blue-700"
            bg="bg-blue-50 border-blue-200"
            icon={<BarChart2 size={13} className="text-blue-500" />}
          />
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-6 py-3 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search evidence…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-48"
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">All Types</option>
          {evidenceTypes.map(t => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </option>
          ))}
        </select>

        {/* Quality range */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="text-gray-400" />
          <span className="text-xs text-gray-500">Quality</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={qualityMin}
              onChange={e => setQualityMin(Math.min(parseFloat(e.target.value) || 0, qualityMax))}
              className="w-14 text-xs border border-gray-200 rounded px-1.5 py-1 font-mono text-center"
            />
            <span className="text-gray-400 text-xs">–</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={qualityMax}
              onChange={e => setQualityMax(Math.max(parseFloat(e.target.value) || 1, qualityMin))}
              className="w-14 text-xs border border-gray-200 rounded px-1.5 py-1 font-mono text-center"
            />
          </div>
        </div>

        {/* Freshness filter */}
        <select
          value={freshnessFilter}
          onChange={e => setFreshnessFilter(e.target.value as any)}
          className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">All Freshness</option>
          <option value="fresh">Fresh (&lt;30d)</option>
          <option value="stale">Stale (30–90d)</option>
          <option value="very-stale">Very Stale (&gt;90d)</option>
        </select>

        {/* Stale only toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setStaleOnly(v => !v)}
            className={`w-9 h-5 rounded-full relative transition-colors ${
              staleOnly ? 'bg-amber-400' : 'bg-gray-200'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                staleOnly ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </div>
          <span className="text-xs text-gray-600 font-medium">Stale only</span>
        </label>

        <span className="ml-auto text-xs text-gray-400">{filtered.length} shown</span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              icon={<Microscope size={40} className="text-gray-300" />}
              title="No evidence found"
              description="Try adjusting your filters or add new evidence items."
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Summary</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Quality</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Source</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Collected</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">Claims</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Freshness</th>
                <th className="px-4 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(ev => {
                const freshness = getFreshness(ev)
                const claimCount = claimCountMap[ev.id] ?? 0
                const dateStr = ev.data_collection_date ?? ev.collected_at
                const isSelected = ev.id === selectedId
                return (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedId(isSelected ? null : ev.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-l-2 border-l-blue-400'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <EvidenceTypeBadge type={ev.evidence_type} />
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs">
                      <span title={ev.summary ?? ''}>{truncate(ev.summary, 80)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <QualityScoreCell
                        score={ev.quality_score}
                        scores={ev.quality_scores as Record<string, number> | null}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {ev.sources?.title ? (
                        <span className="text-xs text-gray-600 line-clamp-1" title={ev.sources.title}>
                          {truncate(ev.sources.title, 30)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{formatDate(dateStr)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${claimCount > 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                        {claimCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <FreshnessDot category={freshness.category} label={freshness.label} />
                        <span className="text-xs text-gray-400 ml-3.5">
                          {isFinite(freshness.ageMs) ? formatDaysAgo(freshness.ageMs) : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <ChevronRight size={14} className={`text-gray-300 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Detail Panel ───────────────────────────────────────────────────── */}
      {selectedEv && (
        <EvidenceDetailPanel
          ev={selectedEv}
          claimCount={claimCountMap[selectedEv.id] ?? 0}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

// ─── Metric Chip ──────────────────────────────────────────────────────────────

function MetricChip({
  label,
  value,
  color = 'text-gray-700',
  bg = 'bg-gray-50 border-gray-200',
  icon,
}: {
  label: string
  value: string | number
  color?: string
  bg?: string
  icon?: React.ReactNode
}) {
  return (
    <div className={`flex items-center gap-1.5 border rounded-lg px-3 py-1.5 ${bg}`}>
      {icon}
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-bold font-mono ${color}`}>{value}</span>
    </div>
  )
}
