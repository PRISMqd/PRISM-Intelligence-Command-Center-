'use client'

import { useState, useMemo, useCallback } from 'react'
import { formatDistanceToNow, isAfter, isBefore, parseISO, startOfWeek, subWeeks } from 'date-fns'
import type { TaskStatus, TaskPriority } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string
  object_id: string | null
  project_id: string | null
  project_name: string | null
  parent_task_id: string | null
  title: string
  description: string | null
  status: string | null
  priority: string | null
  assigned_to: string | null
  due_date: string | null
  started_at: string | null
  completed_at: string | null
  blocked_reason: string | null
  strategic_importance: number | null
  expected_value: number | null
  urgency: number | null
  confidence: number | null
  focus_score: number | null
  tags: string[] | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

interface TasksViewProps {
  tasks: Task[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

type ViewMode = 'board' | 'list' | 'calendar'

const KANBAN_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'TODO', label: 'To Do' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'BLOCKED', label: 'Blocked' },
  { status: 'AWAITING_REVIEW', label: 'Awaiting Review' },
  { status: 'DONE', label: 'Done' },
  { status: 'CANCELLED', label: 'Cancelled' },
]

const PRIORITY_BADGE: Record<string, { label: string; classes: string }> = {
  CRITICAL: { label: 'CRITICAL', classes: 'bg-red-100 text-red-800 border border-red-300' },
  HIGH: { label: 'HIGH', classes: 'bg-amber-100 text-amber-800 border border-amber-300' },
  MEDIUM: { label: 'MEDIUM', classes: 'bg-blue-100 text-blue-800 border border-blue-300' },
  LOW: { label: 'LOW', classes: 'bg-gray-100 text-gray-600 border border-gray-300' },
}

const STATUS_BADGE: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-600 border border-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border border-blue-300',
  BLOCKED: 'bg-red-100 text-red-800 border border-red-300',
  AWAITING_REVIEW: 'bg-purple-100 text-purple-800 border border-purple-300',
  DONE: 'bg-green-100 text-green-800 border border-green-300',
  CANCELLED: 'bg-gray-100 text-gray-400 border border-gray-200',
}

const TERMINAL_STATUSES = new Set(['DONE', 'CANCELLED'])

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isOverdue(task: Task): boolean {
  if (!task.due_date) return false
  if (TERMINAL_STATUSES.has(task.status ?? '')) return false
  return isBefore(parseISO(task.due_date), new Date())
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

function PriorityBadge({ priority }: { priority: string | null }) {
  const cfg = PRIORITY_BADGE[priority ?? ''] ?? PRIORITY_BADGE.LOW
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  const cls = STATUS_BADGE[status ?? ''] ?? STATUS_BADGE.TODO
  const label = status?.replace('_', ' ') ?? 'TODO'
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${cls}`}>
      {label}
    </span>
  )
}

function ProjectChip({ name }: { name: string | null }) {
  if (!name) return null
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 truncate max-w-[120px]">
      {name}
    </span>
  )
}

function AssigneeAvatar({ name }: { name: string | null }) {
  const initials = getInitials(name)
  return (
    <div
      title={name ?? 'Unassigned'}
      className="w-6 h-6 rounded-full bg-slate-600 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0"
    >
      {initials}
    </div>
  )
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const overdue = isOverdue(task)
  const borderClass = overdue ? 'border-l-4 border-red-500' : 'border border-slate-200'

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${borderClass} flex flex-col gap-2`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-800 leading-tight line-clamp-2 flex-1">{task.title}</p>
        <AssigneeAvatar name={task.assigned_to} />
      </div>

      {task.status === 'BLOCKED' && task.blocked_reason && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1 font-medium">
          Blocked: {task.blocked_reason}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1">
        <PriorityBadge priority={task.priority} />
        {task.project_name && <ProjectChip name={task.project_name} />}
      </div>

      {task.due_date && (
        <div className={`text-[11px] font-medium ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
          {overdue ? 'Overdue · ' : 'Due '}
          {fmtDate(task.due_date)}
        </div>
      )}
    </div>
  )
}

// ─── Board View ───────────────────────────────────────────────────────────────

function BoardView({ tasks, onSelect }: { tasks: Task[]; onSelect: (t: Task) => void }) {
  const byStatus = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const col of KANBAN_COLUMNS) map[col.status] = []
    for (const t of tasks) {
      const s = (t.status ?? 'TODO') as TaskStatus
      if (map[s]) map[s].push(t)
      else map['TODO'].push(t)
    }
    return map
  }, [tasks])

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = byStatus[col.status] ?? []
        return (
          <div key={col.status} className="flex-shrink-0 w-64 flex flex-col gap-2">
            {/* Column header */}
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                {col.label}
              </span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                {colTasks.length}
              </span>
            </div>
            {/* Cards */}
            <div className="flex flex-col gap-2">
              {colTasks.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
                  No tasks
                </div>
              )}
              {colTasks.map((t) => (
                <KanbanCard key={t.id} task={t} onClick={() => onSelect(t)} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({ tasks, onSelect }: { tasks: Task[]; onSelect: (t: Task) => void }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Project</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Due</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Assignee</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Focus</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                No tasks found
              </td>
            </tr>
          )}
          {tasks.map((t) => {
            const overdue = isOverdue(t)
            return (
              <tr
                key={t.id}
                onClick={() => onSelect(t)}
                className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-medium text-slate-800 max-w-[280px]">
                  <span className="line-clamp-1">{t.title}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <ProjectChip name={t.project_name} />
                </td>
                <td className={`px-4 py-3 whitespace-nowrap text-xs font-medium ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
                  {fmtDate(t.due_date)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <AssigneeAvatar name={t.assigned_to} />
                    <span className="text-xs text-slate-500 truncate max-w-[80px]">
                      {t.assigned_to ?? '—'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                  {t.created_at ? formatDistanceToNow(parseISO(t.created_at), { addSuffix: true }) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {t.focus_score != null ? (
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {t.focus_score.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Task Detail Panel ────────────────────────────────────────────────────────

function TaskDetailPanel({ task, onClose }: { task: Task; onClose: () => void }) {
  const overdue = isOverdue(task)

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-slate-200">
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="text-base font-semibold text-slate-900 leading-snug">{task.title}</h2>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {task.project_name && <ProjectChip name={task.project_name} />}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 text-xl leading-none"
          aria-label="Close panel"
        >
          &times;
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Blocked reason */}
        {task.status === 'BLOCKED' && task.blocked_reason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Blocked Reason</p>
            <p className="text-sm text-red-800">{task.blocked_reason}</p>
          </div>
        )}

        {/* Description */}
        {task.description && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{task.description}</p>
          </div>
        )}

        {/* Key fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Assignee</p>
            <div className="flex items-center gap-2">
              <AssigneeAvatar name={task.assigned_to} />
              <span className="text-sm text-slate-700">{task.assigned_to ?? 'Unassigned'}</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Due Date</p>
            <p className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-slate-700'}`}>
              {fmtDate(task.due_date)}
              {overdue && <span className="ml-1 text-xs">(Overdue)</span>}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Started</p>
            <p className="text-sm text-slate-700">{fmtDate(task.started_at)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Completed</p>
            <p className="text-sm text-slate-700">{fmtDate(task.completed_at)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Focus Score</p>
            <p className="text-sm text-slate-700 font-semibold">
              {task.focus_score != null ? task.focus_score.toFixed(2) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Urgency</p>
            <p className="text-sm text-slate-700">{task.urgency ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Strategic Importance</p>
            <p className="text-sm text-slate-700">{task.strategic_importance ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Expected Value</p>
            <p className="text-sm text-slate-700">{task.expected_value ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Confidence</p>
            <p className="text-sm text-slate-700">
              {task.confidence != null ? `${(task.confidence * 100).toFixed(0)}%` : '—'}
            </p>
          </div>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <span key={tag} className="text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2 py-0.5">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sub-tasks placeholder */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Sub-tasks</p>
          {task.parent_task_id && (
            <p className="text-xs text-slate-400">
              Parent task ID: <code className="font-mono">{task.parent_task_id}</code>
            </p>
          )}
          <p className="text-xs text-slate-400 italic">No sub-tasks loaded.</p>
        </div>

        {/* Linked objects */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Linked Objects</p>
          {task.object_id ? (
            <p className="text-xs text-slate-500 font-mono">{task.object_id}</p>
          ) : (
            <p className="text-xs text-slate-400 italic">No linked objects.</p>
          )}
        </div>

        {/* Provenance trail */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Provenance Trail</p>
          <div className="space-y-1">
            {task.created_at && (
              <div className="text-xs text-slate-500">
                <span className="font-medium">Created</span>{' '}
                {formatDistanceToNow(parseISO(task.created_at), { addSuffix: true })}
              </div>
            )}
            {task.updated_at && task.updated_at !== task.created_at && (
              <div className="text-xs text-slate-500">
                <span className="font-medium">Updated</span>{' '}
                {formatDistanceToNow(parseISO(task.updated_at), { addSuffix: true })}
              </div>
            )}
            {task.started_at && (
              <div className="text-xs text-slate-500">
                <span className="font-medium">Started</span> {fmtDate(task.started_at)}
              </div>
            )}
            {task.completed_at && (
              <div className="text-xs text-slate-500">
                <span className="font-medium">Completed</span> {fmtDate(task.completed_at)}
              </div>
            )}
          </div>
        </div>

        {/* Notes / Comments */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notes & Comments</p>
          {task.notes ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{task.notes}</p>
          ) : (
            <p className="text-xs text-slate-400 italic">No notes.</p>
          )}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <textarea
              rows={3}
              placeholder="Add a comment..."
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 placeholder-slate-400"
            />
            <button className="mt-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800">
              Post comment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface Filters {
  status: string
  priority: string
  project: string
  overdueOnly: boolean
  blockedOnly: boolean
}

function FilterBar({
  filters,
  projects,
  onChange,
}: {
  filters: Filters
  projects: string[]
  onChange: (f: Partial<Filters>) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value })}
        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        <option value="">All Statuses</option>
        {['TODO', 'IN_PROGRESS', 'BLOCKED', 'AWAITING_REVIEW', 'DONE', 'CANCELLED'].map((s) => (
          <option key={s} value={s}>
            {s.replace('_', ' ')}
          </option>
        ))}
      </select>

      <select
        value={filters.priority}
        onChange={(e) => onChange({ priority: e.target.value })}
        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        <option value="">All Priorities</option>
        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select
        value={filters.project}
        onChange={(e) => onChange({ project: e.target.value })}
        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        <option value="">All Projects</option>
        {projects.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.overdueOnly}
          onChange={(e) => onChange({ overdueOnly: e.target.checked })}
          className="rounded border-slate-300 text-red-600 focus:ring-red-400"
        />
        <span className="text-sm text-red-700 font-medium">Overdue only</span>
      </label>

      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.blockedOnly}
          onChange={(e) => onChange({ blockedOnly: e.target.checked })}
          className="rounded border-slate-300 text-red-600 focus:ring-red-400"
        />
        <span className="text-sm text-red-700 font-medium">Blocked only</span>
      </label>
    </div>
  )
}

// ─── Metrics Strip ────────────────────────────────────────────────────────────

function MetricsStrip({ tasks }: { tasks: Task[] }) {
  const now = new Date()
  const weekStart = startOfWeek(now)
  const fourWeeksAgo = subWeeks(now, 4)

  const total = tasks.length
  const overdue = tasks.filter(isOverdue).length
  const blocked = tasks.filter((t) => t.status === 'BLOCKED').length
  const completedThisWeek = tasks.filter(
    (t) =>
      t.status === 'DONE' &&
      t.completed_at &&
      isAfter(parseISO(t.completed_at), weekStart)
  ).length

  const completedLast4Weeks = tasks.filter(
    (t) =>
      t.status === 'DONE' &&
      t.completed_at &&
      isAfter(parseISO(t.completed_at), fourWeeksAgo)
  ).length
  const velocity = (completedLast4Weeks / 4).toFixed(1)

  const metrics = [
    { label: 'Total', value: total, danger: false },
    { label: 'Overdue', value: overdue, danger: overdue > 0 },
    { label: 'Blocked', value: blocked, danger: blocked > 0 },
    { label: 'Done This Week', value: completedThisWeek, danger: false },
    { label: 'Velocity (4-wk)', value: `${velocity}/wk`, danger: false },
  ]

  return (
    <div className="grid grid-cols-5 gap-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-col gap-0.5 shadow-sm"
        >
          <span className={`text-2xl font-bold ${m.danger ? 'text-red-600' : 'text-slate-800'}`}>
            {m.value}
          </span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{m.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function TasksView({ tasks }: TasksViewProps) {
  const [view, setView] = useState<ViewMode>('board')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filters, setFilters] = useState<Filters>({
    status: '',
    priority: '',
    project: '',
    overdueOnly: false,
    blockedOnly: false,
  })

  const updateFilter = useCallback((patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
  }, [])

  // Unique projects for filter dropdown
  const projectNames = useMemo(() => {
    const names = new Set<string>()
    for (const t of tasks) {
      if (t.project_name) names.add(t.project_name)
    }
    return Array.from(names).sort()
  }, [tasks])

  // Apply filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.status && t.status !== filters.status) return false
      if (filters.priority && t.priority !== filters.priority) return false
      if (filters.project && t.project_name !== filters.project) return false
      if (filters.overdueOnly && !isOverdue(t)) return false
      if (filters.blockedOnly && t.status !== 'BLOCKED') return false
      return true
    })
  }, [tasks, filters])

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Tasks</h1>
        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
          {(['board', 'list', 'calendar'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium transition-colors capitalize
                ${view === v
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              {v === 'board' ? 'Board' : v === 'list' ? 'List' : 'Calendar'}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics strip */}
      <MetricsStrip tasks={tasks} />

      {/* Filter bar */}
      <FilterBar filters={filters} projects={projectNames} onChange={updateFilter} />

      {/* Content */}
      {view === 'board' && (
        <BoardView tasks={filteredTasks} onSelect={setSelectedTask} />
      )}
      {view === 'list' && (
        <ListView tasks={filteredTasks} onSelect={setSelectedTask} />
      )}
      {view === 'calendar' && (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200 text-slate-400">
          <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-base font-medium text-slate-500">Coming soon</p>
          <p className="text-sm text-slate-400 mt-1">Calendar view is under construction.</p>
        </div>
      )}

      {/* Task detail panel */}
      {selectedTask && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedTask(null)}
          />
          <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
        </>
      )}
    </div>
  )
}
