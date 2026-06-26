'use client'

import { useState, useTransition, useCallback, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  User, Building2, Package, FileCheck, Microscope, BookOpen,
  GitBranch, HelpCircle, Eye, AlertTriangle, CheckSquare, Folder,
  BarChart2, FlaskConical, FileText, Ghost, Zap, Bot,
  Search, ChevronLeft, ChevronRight, X, ExternalLink, Plus,
  Clock, Tag, Info,
} from 'lucide-react'
import { OBJECT_TYPE_CONFIG, type ObjectType } from '@/lib/types'
import type { Tables } from '@/lib/database.types'
import ConfidenceBar from '@/components/ui/ConfidenceBar'
import LoadingSkeleton from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase'

type ObjectRow = Tables<'objects'>
type ProvenanceEvent = Tables<'provenance_events'>

// ─── Icon map ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  User, Building2, Package, FileCheck, Microscope, BookOpen,
  GitBranch, HelpCircle, Eye, AlertTriangle, CheckSquare, Folder,
  BarChart2, FlaskConical, FileText, Ghost, Zap, Bot,
}

function TypeIcon({ type, size = 14 }: { type: string; size?: number }) {
  const cfg = OBJECT_TYPE_CONFIG[type as ObjectType]
  if (!cfg) return null
  const Icon = ICON_MAP[cfg.icon]
  if (!Icon) return null
  return <Icon size={size} />
}

// ─── Status badge (generic, no type discrimination needed) ───────────────────

const STATUS_PALETTE: Record<string, string> = {
  // claim
  supported: 'bg-green-100 text-green-800',
  unsupported: 'bg-amber-100 text-amber-800',
  contested: 'bg-red-100 text-red-800',
  // task
  TODO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  BLOCKED: 'bg-red-100 text-red-800',
  AWAITING_REVIEW: 'bg-amber-100 text-amber-800',
  DONE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
  // decision
  MADE: 'bg-green-100 text-green-800',
  IMPLEMENTING: 'bg-blue-100 text-blue-800',
  OUTCOME_KNOWN: 'bg-purple-100 text-purple-800',
  REVIEWED: 'bg-gray-100 text-gray-600',
  // assumption
  active: 'bg-amber-100 text-amber-800',
  validated: 'bg-green-100 text-green-800',
  invalidated: 'bg-red-100 text-red-800',
  superseded: 'bg-gray-100 text-gray-500',
  // unknown
  open: 'bg-gray-100 text-gray-600',
  investigating: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  accepted: 'bg-amber-100 text-amber-800',
  deferred: 'bg-gray-100 text-gray-500',
  // risk level
  critical: 'bg-red-100 text-red-800',
  high: 'bg-amber-100 text-amber-800',
  medium: 'bg-blue-100 text-blue-800',
  low: 'bg-gray-100 text-gray-600',
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-gray-400">—</span>
  const cls = STATUS_PALETTE[status] ?? 'bg-gray-100 text-gray-600'
  const label = status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

interface DetailPanelProps {
  object: ObjectRow | null
  onClose: () => void
}

function DetailPanel({ object, onClose }: DetailPanelProps) {
  const [linkedObjects, setLinkedObjects] = useState<ObjectRow[]>([])
  const [provenanceEvents, setProvenanceEvents] = useState<ProvenanceEvent[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const open = object !== null

  useEffect(() => {
    if (!object) {
      setLinkedObjects([])
      setProvenanceEvents([])
      return
    }
    setLoadingDetail(true)
    const supabase = createClient()
    Promise.all([
      supabase
        .from('relationships')
        .select('target_object_id, source_object_id, relationship_type')
        .or(`source_object_id.eq.${object.id},target_object_id.eq.${object.id}`)
        .limit(10),
      supabase
        .from('provenance_events')
        .select('*')
        .eq('object_id', object.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]).then(async ([relResult, provResult]) => {
      setProvenanceEvents(provResult.data ?? [])
      // Collect linked IDs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const linkedIds = ((relResult.data ?? []) as any[]).map((r) =>
        r.source_object_id === object.id ? r.target_object_id : r.source_object_id
      )
      if (linkedIds.length > 0) {
        const { data } = await supabase
          .from('objects')
          .select('*')
          .in('id', linkedIds)
          .is('deleted_at', null)
        setLinkedObjects(data ?? [])
      } else {
        setLinkedObjects([])
      }
      setLoadingDetail(false)
    })
  }, [object?.id])

  // Trap focus-close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const cfg = object ? OBJECT_TYPE_CONFIG[object.object_type as ObjectType] : null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label={object?.name ?? 'Object detail'}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {cfg && (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: cfg.color + '22', color: cfg.color }}
              >
                <TypeIcon type={object?.object_type ?? ''} size={18} />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900 truncate">
                {object?.name ?? ''}
              </h2>
              {cfg && (
                <span className="text-xs text-gray-500">{cfg.label}</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {object && (
            <>
              {/* Core fields */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Details
                </h3>
                <dl className="space-y-2.5">
                  {object.description && (
                    <div>
                      <dt className="text-xs text-gray-500 mb-0.5">Description</dt>
                      <dd className="text-sm text-gray-800">{object.description}</dd>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <div>
                      <dt className="text-xs text-gray-500 mb-0.5">Status</dt>
                      <dd><StatusBadge status={object.status} /></dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 mb-0.5">Domain</dt>
                      <dd className="text-sm text-gray-800">{object.domain ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 mb-0.5">Confidence</dt>
                      <dd className="pt-1">
                        {object.confidence_score != null
                          ? <ConfidenceBar score={object.confidence_score} showLabel />
                          : <span className="text-xs text-gray-400">—</span>
                        }
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 mb-0.5">Archived</dt>
                      <dd className="text-sm text-gray-800">{object.is_archived ? 'Yes' : 'No'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 mb-0.5">Created</dt>
                      <dd className="text-sm text-gray-800">{object.created_at ? new Date(object.created_at).toLocaleDateString() : '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 mb-0.5">Updated</dt>
                      <dd className="text-sm text-gray-800">{relativeTime(object.updated_at)}</dd>
                    </div>
                  </div>
                  {object.tags && object.tags.length > 0 && (
                    <div>
                      <dt className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                        <Tag size={11} /> Tags
                      </dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {object.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-600">
                            {tag}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                  {object.metadata && Object.keys(object.metadata as object).length > 0 && (
                    <div>
                      <dt className="text-xs text-gray-500 mb-1">Metadata</dt>
                      <dd>
                        <pre className="text-xs bg-gray-50 rounded-md p-2.5 overflow-x-auto text-gray-700 border border-gray-100">
                          {JSON.stringify(object.metadata, null, 2)}
                        </pre>
                      </dd>
                    </div>
                  )}
                </dl>
              </section>

              {/* Linked objects */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ExternalLink size={11} />
                  Linked Objects
                  {linkedObjects.length > 0 && (
                    <span className="text-gray-300">({linkedObjects.length})</span>
                  )}
                </h3>
                {loadingDetail ? (
                  <div className="h-10 bg-gray-100 rounded animate-pulse" />
                ) : linkedObjects.length === 0 ? (
                  <p className="text-xs text-gray-400">No linked objects.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {linkedObjects.map((linked) => {
                      const lCfg = OBJECT_TYPE_CONFIG[linked.object_type as ObjectType]
                      return (
                        <li
                          key={linked.id}
                          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          {lCfg && (
                            <span
                              className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                              style={{ color: lCfg.color }}
                            >
                              <TypeIcon type={linked.object_type} size={12} />
                            </span>
                          )}
                          <span className="text-sm text-gray-800 truncate">{linked.name}</span>
                          {lCfg && (
                            <span className="text-xs text-gray-400 shrink-0">{lCfg.label}</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>

              {/* Provenance history */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock size={11} />
                  Provenance History
                </h3>
                {loadingDetail ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : provenanceEvents.length === 0 ? (
                  <p className="text-xs text-gray-400">No provenance events recorded.</p>
                ) : (
                  <ol className="relative border-l border-gray-200 space-y-4 ml-2">
                    {provenanceEvents.map((ev) => (
                      <li key={ev.id} className="ml-4">
                        <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-gray-300" />
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-700">{ev.event_type ?? 'Event'}</p>
                            {ev.summary && (
                              <p className="text-xs text-gray-500 mt-0.5">{ev.summary}</p>
                            )}
                            {ev.actor_name && (
                              <p className="text-xs text-gray-400 mt-0.5">by {ev.actor_name}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 shrink-0 mt-0.5">
                            {relativeTime(ev.created_at)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Type filter chip ─────────────────────────────────────────────────────────

interface TypeChipProps {
  type: ObjectType | ''
  label: string
  color: string
  count: number
  active: boolean
  onClick: () => void
}

function TypeChip({ label, color, count, active, onClick }: TypeChipProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all
        ${active
          ? 'text-white border-transparent shadow-sm'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      style={active ? { backgroundColor: color, borderColor: color } : {}}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}
      >
        {count}
      </span>
    </button>
  )
}

// ─── Create tooltip button ────────────────────────────────────────────────────

function CreateButton() {
  const [showTip, setShowTip] = useState(false)
  return (
    <div className="relative">
      <button
        disabled
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
        aria-describedby="create-tooltip"
      >
        <Plus size={14} />
        Create
      </button>
      {showTip && (
        <div
          id="create-tooltip"
          role="tooltip"
          className="absolute right-0 top-full mt-1.5 z-10 w-max rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg"
        >
          Coming in Admin module
          <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ObjectsViewProps {
  objects: ObjectRow[]
  totalCount: number
  typeCounts: Record<string, number>
  page: number
  pageSize: number
  typeFilter: ObjectType | ''
  statusFilter: string
  searchQuery: string
}

export default function ObjectsView({
  objects,
  totalCount,
  typeCounts,
  page,
  pageSize,
  typeFilter,
  statusFilter,
  searchQuery,
}: ObjectsViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [selectedObject, setSelectedObject] = useState<ObjectRow | null>(null)
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const navigate = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const sp = new URLSearchParams()
      const current: Record<string, string | number | undefined> = {
        page,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        q: searchQuery || undefined,
        ...updates,
      }
      for (const [k, v] of Object.entries(current)) {
        if (v !== undefined && v !== '' && !(k === 'page' && v === 1)) {
          sp.set(k, String(v))
        }
      }
      const qs = sp.toString()
      startTransition(() => {
        router.push(`${pathname}${qs ? `?${qs}` : ''}`)
      })
    },
    [router, pathname, page, typeFilter, statusFilter, searchQuery, startTransition]
  )

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      navigate({ q: value || undefined, page: 1 })
    }, 350)
  }

  // Sorted type list by count desc
  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])

  const allCount = Object.values(typeCounts).reduce((s, n) => s + n, 0)

  return (
    <div className="flex flex-col gap-5 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Objects</h1>
          <span className="text-sm text-gray-400 tabular-nums">
            {totalCount.toLocaleString()} total
          </span>
        </div>
        <CreateButton />
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        <TypeChip
          type=""
          label="All"
          color="#374151"
          count={allCount}
          active={typeFilter === ''}
          onClick={() => navigate({ type: undefined, page: 1 })}
        />
        {typeEntries.map(([type, count]) => {
          const cfg = OBJECT_TYPE_CONFIG[type as ObjectType]
          if (!cfg) return null
          return (
            <TypeChip
              key={type}
              type={type as ObjectType}
              label={cfg.label}
              color={cfg.color}
              count={count}
              active={typeFilter === type}
              onClick={() => navigate({ type, page: 1 })}
            />
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search by name..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => navigate({ status: e.target.value || undefined, page: 1 })}
          className="rounded-md border border-gray-200 bg-white py-1.5 pl-2.5 pr-7 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <optgroup label="Claims">
            <option value="supported">Supported</option>
            <option value="unsupported">Unsupported</option>
            <option value="contested">Contested</option>
          </optgroup>
          <optgroup label="Tasks">
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DONE">Done</option>
          </optgroup>
          <optgroup label="Decisions">
            <option value="MADE">Made</option>
            <option value="IMPLEMENTING">Implementing</option>
          </optgroup>
          <optgroup label="Assumptions">
            <option value="active">Active</option>
            <option value="validated">Validated</option>
            <option value="invalidated">Invalidated</option>
          </optgroup>
          <optgroup label="Unknowns">
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </optgroup>
        </select>

        {/* Clear filters */}
        {(typeFilter || statusFilter || searchQuery) && (
          <button
            onClick={() => {
              setLocalSearch('')
              navigate({ type: undefined, status: undefined, q: undefined, page: 1 })
            }}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {isPending ? (
          <div className="p-4">
            <LoadingSkeleton count={8} />
          </div>
        ) : objects.length === 0 ? (
          <EmptyState
            icon="🗂"
            title="No objects found"
            description={
              typeFilter || statusFilter || searchQuery
                ? 'Try adjusting your filters or search query.'
                : 'No objects have been created yet.'
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Confidence</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Updated</th>
                <th className="px-4 py-2.5 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {objects.map((obj) => {
                const cfg = OBJECT_TYPE_CONFIG[obj.object_type as ObjectType]
                return (
                  <tr
                    key={obj.id}
                    onClick={() => setSelectedObject(obj)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 truncate max-w-xs block">
                        {obj.name}
                      </span>
                      {obj.domain && (
                        <span className="text-xs text-gray-400">{obj.domain}</span>
                      )}
                    </td>

                    {/* Type badge */}
                    <td className="px-4 py-3">
                      {cfg ? (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: cfg.color + '18',
                            color: cfg.color,
                          }}
                        >
                          <TypeIcon type={obj.object_type} size={11} />
                          {cfg.label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">{obj.object_type}</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={obj.status} />
                    </td>

                    {/* Confidence */}
                    <td className="px-4 py-3">
                      {obj.confidence_score != null ? (
                        <ConfidenceBar score={obj.confidence_score} showLabel />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Updated */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {relativeTime(obj.updated_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedObject(obj)
                        }}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {((page - 1) * pageSize + 1).toLocaleString()}–
            {Math.min(page * pageSize, totalCount).toLocaleString()} of{' '}
            {totalCount.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ page: page - 1 })}
              disabled={page <= 1 || isPending}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <span className="text-xs text-gray-500 tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => navigate({ page: page + 1 })}
              disabled={page >= totalPages || isPending}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Detail panel */}
      <DetailPanel object={selectedObject} onClose={() => setSelectedObject(null)} />
    </div>
  )
}
