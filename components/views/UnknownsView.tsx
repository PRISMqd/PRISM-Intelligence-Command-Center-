'use client'

import { useState, useMemo, useCallback } from 'react'
import { formatDistanceToNow, parseISO, subDays, isAfter } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Unknown {
  id: string
  object_id: string | null
  unknown_text: string
  description: string | null
  status: string | null
  category: string | null
  impact_if_resolved: number | null
  probability_changes_decision: number | null
  decision_value: number | null
  cost_to_resolve: number | null
  cost_of_delay: number | null
  evi_score: number | null
  investigation_notes: string | null
  resolved_at: string | null
  resolution_notes: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
  // ghost note indicator via metadata (fetched separately or embedded)
  metadata?: Record<string, unknown> | null
}

interface UnknownsViewProps {
  unknowns: Unknown[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGE_STYLES: Record<string, string> = {
  open: 'bg-gray-100 text-gray-600 border border-gray-300',
  investigating: 'bg-blue-100 text-blue-800 border border-blue-300',
  resolved: 'bg-green-100 text-green-800 border border-green-300',
  accepted: 'bg-amber-100 text-amber-800 border border-amber-300',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: number | null, decimals = 2): string {
  if (val == null) return '—'
  return val.toFixed(decimals)
}

function getEviQuartileBounds(scores: (number | null)[]): { q1: number; q3: number } {
  const valid = scores.filter((s): s is number => s != null).sort((a, b) => a - b)
  if (valid.length === 0) return { q1: 0, q3: 0 }
  const q1 = valid[Math.floor(valid.length * 0.25)] ?? 0
  const q3 = valid[Math.floor(valid.length * 0.75)] ?? 0
  return { q1, q3 }
}

function getEviBadgeStyle(score: number | null, q1: number, q3: number): string {
  if (score == null) return 'bg-gray-200 text-gray-500'
  if (score >= q3) return 'text-white' // deep blue via inline style
  if (score <= q1) return 'bg-gray-200 text-gray-600'
  return 'bg-blue-100 text-blue-800'
}

function isTopQuartile(score: number | null, q3: number): boolean {
  return score != null && score >= q3
}

function isBottomQuartile(score: number | null, q1: number): boolean {
  return score != null && score <= q1
}

// ─── Resolve Modal ────────────────────────────────────────────────────────────

interface ResolveModalProps {
  unknown: Unknown
  onConfirm: (notes: string) => void
  onCancel: () => void
}

function ResolveModal({ unknown, onConfirm, onCancel }: ResolveModalProps) {
  const [notes, setNotes] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Resolve Unknown</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 italic">
          &ldquo;{unknown.unknown_text}&rdquo;
        </p>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Resolution notes <span className="text-red-500">*</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Describe how this unknown was resolved..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
        <div className="flex gap-3 justify-end mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(notes)}
            disabled={!notes.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            Confirm Resolve
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Accept Modal ─────────────────────────────────────────────────────────────

interface AcceptModalProps {
  unknown: Unknown
  onConfirm: (rationale: string) => void
  onCancel: () => void
}

function AcceptModal({ unknown, onConfirm, onCancel }: AcceptModalProps) {
  const [rationale, setRationale] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Accept as Permanent Unknown</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 italic">
          &ldquo;{unknown.unknown_text}&rdquo;
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-sm text-amber-800">
          Accepting marks this as a known permanent unknown — it will no longer surface as requiring investigation.
        </div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Rationale <span className="text-red-500">*</span>
        </label>
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={3}
          placeholder="Why is this accepted as a permanent unknown?"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
        <div className="flex gap-3 justify-end mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(rationale)}
            disabled={!rationale.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            Accept Unknown
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Ghost Icon ───────────────────────────────────────────────────────────────

function GhostIcon() {
  return (
    <svg
      className="w-4 h-4 text-indigo-400 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Ghost note linked"
    >
      <path d="M12 2a8 8 0 0 0-8 8v10l3-3 2 2 2-2 2 2 2-2 3 3V10a8 8 0 0 0-8-8zm-2.5 10a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
    </svg>
  )
}

// ─── Expanded Row ─────────────────────────────────────────────────────────────

interface ExpandedRowProps {
  unknown: Unknown
  actionLoading: string | null
  onMarkInvestigating: (id: string, notes: string, resolutionDate: string) => void
  onResolve: (id: string) => void
  onAccept: (id: string) => void
}

function ExpandedRow({
  unknown,
  actionLoading,
  onMarkInvestigating,
  onResolve,
  onAccept,
}: ExpandedRowProps) {
  const isLoading = actionLoading === unknown.id
  const isInvestigating = unknown.status === 'investigating'

  const [investigationNotes, setInvestigationNotes] = useState(unknown.investigation_notes ?? '')
  const [expectedDate, setExpectedDate] = useState('')

  // Related decisions — placeholder: link via object_id
  const hasObjectLink = !!unknown.object_id
  const hasGhostNote = !!(unknown.metadata && (unknown.metadata as Record<string, unknown>).ghost_note_id)

  return (
    <div className="px-6 py-5 bg-gray-50 border-t border-gray-200 space-y-5">
      {/* Full text */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Unknown Text</h4>
        <p className="text-sm text-gray-800 leading-relaxed">{unknown.unknown_text}</p>
        {unknown.description && (
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{unknown.description}</p>
        )}
      </div>

      {/* EVI inputs with labels */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">EVI Inputs</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              label: 'Impact',
              sublabel: 'Impact if resolved',
              value: fmt(unknown.impact_if_resolved),
            },
            {
              label: 'Probability',
              sublabel: 'Probability changes decision',
              value: fmt(unknown.probability_changes_decision),
            },
            {
              label: 'Decision Value',
              sublabel: 'Value of the decision',
              value: fmt(unknown.decision_value),
            },
            {
              label: 'Cost to Resolve',
              sublabel: 'Cost of resolving this unknown',
              value: fmt(unknown.cost_to_resolve),
            },
            {
              label: 'Cost of Delay',
              sublabel: 'Cost of not resolving now',
              value: fmt(unknown.cost_of_delay),
            },
          ].map(({ label, sublabel, value }) => (
            <div key={label} className="bg-white rounded border border-gray-200 p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{value}</div>
              <div className="text-xs font-semibold text-gray-700 mt-0.5">{label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sublabel}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Investigation notes (always visible when investigating) */}
      {isInvestigating && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Investigation Notes
            </label>
            <textarea
              value={investigationNotes}
              onChange={(e) => setInvestigationNotes(e.target.value)}
              rows={3}
              placeholder="Document investigation progress..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Expected Resolution Date
            </label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Related decisions */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Related Decisions</h4>
        {hasObjectLink ? (
          <div className="text-sm text-gray-700">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-blue-800">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 015.657 5.657l-1.415 1.415a4 4 0 01-5.657-5.657m-2.828 2.828a4 4 0 01-5.657-5.657L5.757 7.1a4 4 0 015.657 5.657" />
              </svg>
              Linked to object {unknown.object_id}
            </span>
            <p className="text-xs text-gray-400 mt-1">This unknown blocks or informs decisions associated with the linked object.</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No related decisions linked.</p>
        )}
      </div>

      {/* Ghost note */}
      {hasGhostNote && (
        <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-3 py-2">
          <GhostIcon />
          <span>
            Ghost note linked:{' '}
            <code className="text-xs bg-indigo-100 px-1 rounded">
              {String((unknown.metadata as Record<string, unknown>).ghost_note_id)}
            </code>
          </span>
        </div>
      )}

      {/* Notes */}
      {unknown.notes && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</h4>
          <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded p-3 whitespace-pre-wrap">
            {unknown.notes}
          </p>
        </div>
      )}

      {/* Resolution notes (if resolved) */}
      {unknown.resolution_notes && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Resolution Notes</h4>
          <p className="text-sm text-gray-700 bg-green-50 border border-green-200 rounded p-3 whitespace-pre-wrap">
            {unknown.resolution_notes}
          </p>
        </div>
      )}

      {/* Timestamps */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
        {unknown.created_at && (
          <span>Created {formatDistanceToNow(parseISO(unknown.created_at), { addSuffix: true })}</span>
        )}
        {unknown.resolved_at && (
          <span>Resolved {formatDistanceToNow(parseISO(unknown.resolved_at), { addSuffix: true })}</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
        {unknown.status !== 'investigating' && unknown.status !== 'resolved' && unknown.status !== 'accepted' && (
          <button
            onClick={() => onMarkInvestigating(unknown.id, investigationNotes, expectedDate)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Saving…' : 'Mark Investigating'}
          </button>
        )}
        {unknown.status === 'investigating' && (
          <button
            onClick={() => onMarkInvestigating(unknown.id, investigationNotes, expectedDate)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Saving…' : 'Save Investigation Notes'}
          </button>
        )}
        {unknown.status !== 'resolved' && unknown.status !== 'accepted' && (
          <button
            onClick={() => onResolve(unknown.id)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-300 rounded hover:bg-green-100 disabled:opacity-50 transition-colors"
          >
            Resolve
          </button>
        )}
        {unknown.status !== 'accepted' && unknown.status !== 'resolved' && (
          <button
            onClick={() => onAccept(unknown.id)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded hover:bg-amber-100 disabled:opacity-50 transition-colors"
          >
            Accept
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function UnknownsView({ unknowns: initialUnknowns }: UnknownsViewProps) {
  const [unknowns, setUnknowns] = useState<Unknown[]>(initialUnknowns)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Modal state
  const [resolveTarget, setResolveTarget] = useState<Unknown | null>(null)
  const [acceptTarget, setAcceptTarget] = useState<Unknown | null>(null)

  // ── EVI quartile bounds ───────────────────────────────────────────────────────

  const { q1, q3 } = useMemo(
    () => getEviQuartileBounds(unknowns.map((u) => u.evi_score)),
    [unknowns]
  )

  // ── Header metrics ────────────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30)
    const open = unknowns.filter((u) => u.status === 'open' || u.status == null)
    const highEvi = unknowns.filter((u) => isTopQuartile(u.evi_score, q3))
    const investigating = unknowns.filter((u) => u.status === 'investigating')
    const resolvedRecently = unknowns.filter(
      (u) =>
        u.status === 'resolved' &&
        u.resolved_at != null &&
        isAfter(parseISO(u.resolved_at), thirtyDaysAgo)
    )
    return {
      open: open.length,
      highEvi: highEvi.length,
      investigating: investigating.length,
      resolvedRecently: resolvedRecently.length,
    }
  }, [unknowns, q3])

  // ── Patch helper ──────────────────────────────────────────────────────────────

  const patchUnknown = useCallback(async (id: string, body: Record<string, unknown>) => {
    setActionLoading(id)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/unknowns/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...body }),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated: Unknown = await res.json()
      setUnknowns((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)))
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Action failed.')
    } finally {
      setActionLoading(null)
    }
  }, [])

  const handleMarkInvestigating = useCallback(
    (id: string, notes: string, expectedDate: string) =>
      patchUnknown(id, {
        status: 'investigating',
        investigation_notes: notes || null,
        expected_resolution_date: expectedDate || null,
      }),
    [patchUnknown]
  )

  const handleResolveConfirm = useCallback(
    async (resolutionNotes: string) => {
      if (!resolveTarget) return
      const id = resolveTarget.id
      setResolveTarget(null)
      await patchUnknown(id, {
        status: 'resolved',
        resolution_notes: resolutionNotes,
        resolved_at: new Date().toISOString(),
      })
    },
    [resolveTarget, patchUnknown]
  )

  const handleAcceptConfirm = useCallback(
    async (rationale: string) => {
      if (!acceptTarget) return
      const id = acceptTarget.id
      setAcceptTarget(null)
      await patchUnknown(id, {
        status: 'accepted',
        notes: rationale,
      })
    },
    [acceptTarget, patchUnknown]
  )

  const handleResolve = useCallback(
    (id: string) => {
      const u = unknowns.find((x) => x.id === id) ?? null
      setResolveTarget(u)
    },
    [unknowns]
  )

  const handleAccept = useCallback(
    (id: string) => {
      const u = unknowns.find((x) => x.id === id) ?? null
      setAcceptTarget(u)
    },
    [unknowns]
  )

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Resolve modal */}
      {resolveTarget && (
        <ResolveModal
          unknown={resolveTarget}
          onConfirm={handleResolveConfirm}
          onCancel={() => setResolveTarget(null)}
        />
      )}

      {/* Accept modal */}
      {acceptTarget && (
        <AcceptModal
          unknown={acceptTarget}
          onConfirm={handleAcceptConfirm}
          onCancel={() => setAcceptTarget(null)}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 px-6 py-5 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unknown Risk Register</h1>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono bg-gray-50 border border-gray-200 rounded px-3 py-2 w-fit">
            <svg
              className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 7h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z"
              />
            </svg>
            EVI = impact &times; probability &times; decision_value &minus; cost_to_resolve &minus; cost_of_delay
          </div>
        </div>

        {/* ── Metrics strip ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm text-center">
            <div className="text-2xl font-bold text-gray-900">{metrics.open}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total Open</div>
          </div>
          <div
            className="border rounded-lg px-4 py-3 shadow-sm text-center"
            style={{ backgroundColor: '#EBF2FA', borderColor: '#1F4E79' }}
          >
            <div className="text-2xl font-bold" style={{ color: '#1F4E79' }}>
              {metrics.highEvi}
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#1F4E79' }}>
              High EVI (top quartile)
            </div>
          </div>
          <div className="bg-white border border-blue-200 rounded-lg px-4 py-3 shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-700">{metrics.investigating}</div>
            <div className="text-xs text-gray-500 mt-0.5">Currently Investigating</div>
          </div>
          <div className="bg-white border border-green-200 rounded-lg px-4 py-3 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-700">{metrics.resolvedRecently}</div>
            <div className="text-xs text-gray-500 mt-0.5">Resolved last 30 days</div>
          </div>
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
                    Unknown
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    EVI Score
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Impact
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Probability
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Decision Value
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unknowns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                      No unknowns recorded.
                    </td>
                  </tr>
                ) : (
                  unknowns.map((u) => {
                    const isExpanded = expandedId === u.id
                    const topQ = isTopQuartile(u.evi_score, q3)
                    const botQ = isBottomQuartile(u.evi_score, q1)
                    const badgeBase = getEviBadgeStyle(u.evi_score, q1, q3)
                    const hasGhostNote = !!(
                      u.metadata && (u.metadata as Record<string, unknown>).ghost_note_id
                    )

                    // Cost = cost_to_resolve + cost_of_delay combined display
                    const cost =
                      u.cost_to_resolve != null || u.cost_of_delay != null
                        ? ((u.cost_to_resolve ?? 0) + (u.cost_of_delay ?? 0)).toFixed(2)
                        : '—'

                    return (
                      <>
                        <tr
                          key={u.id}
                          onClick={() => setExpandedId(isExpanded ? null : u.id)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Unknown text */}
                          <td className="px-4 py-3 max-w-[300px]">
                            <div className="flex items-center gap-2">
                              <svg
                                className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${
                                  isExpanded ? 'rotate-90' : ''
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                              <span className="text-gray-800 leading-snug line-clamp-2">
                                {u.unknown_text.length > 110
                                  ? u.unknown_text.slice(0, 110) + '…'
                                  : u.unknown_text}
                              </span>
                              {hasGhostNote && <GhostIcon />}
                            </div>
                          </td>

                          {/* Category badge */}
                          <td className="px-4 py-3 text-center">
                            {u.category ? (
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 capitalize">
                                {u.category}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>

                          {/* EVI score */}
                          <td className="px-4 py-3 text-center">
                            {u.evi_score != null ? (
                              <span
                                className={`inline-block px-3 py-1 rounded-md font-bold text-base font-mono ${
                                  topQ ? '' : botQ ? 'bg-gray-200 text-gray-600' : badgeBase
                                }`}
                                style={
                                  topQ
                                    ? { backgroundColor: '#1F4E79', color: '#ffffff' }
                                    : undefined
                                }
                              >
                                {u.evi_score.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>

                          {/* Impact */}
                          <td className="px-4 py-3 text-center text-gray-700 font-mono text-xs">
                            {fmt(u.impact_if_resolved)}
                          </td>

                          {/* Probability */}
                          <td className="px-4 py-3 text-center text-gray-700 font-mono text-xs">
                            {fmt(u.probability_changes_decision)}
                          </td>

                          {/* Decision value */}
                          <td className="px-4 py-3 text-center text-gray-700 font-mono text-xs">
                            {fmt(u.decision_value)}
                          </td>

                          {/* Cost (combined) */}
                          <td className="px-4 py-3 text-center text-gray-700 font-mono text-xs">
                            {cost}
                          </td>

                          {/* Status badge */}
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                STATUS_BADGE_STYLES[u.status ?? 'open'] ??
                                'bg-gray-100 text-gray-500 border border-gray-200'
                              }`}
                            >
                              {u.status ?? 'open'}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {isExpanded && (
                          <tr key={`${u.id}-expanded`}>
                            <td colSpan={8} className="p-0">
                              <ExpandedRow
                                unknown={u}
                                actionLoading={actionLoading}
                                onMarkInvestigating={handleMarkInvestigating}
                                onResolve={handleResolve}
                                onAccept={handleAccept}
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
            {unknowns.length} unknown{unknowns.length !== 1 ? 's' : ''} · Sorted by EVI score
            descending · Click any row to expand details
          </div>
        </div>
      </div>
    </div>
  )
}
