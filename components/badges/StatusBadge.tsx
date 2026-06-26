'use client'

type StatusType = 'claim' | 'task' | 'decision' | 'assumption' | 'unknown' | 'risk'

interface StatusBadgeProps {
  status: string
  type: StatusType
  className?: string
}

type ColorClass = string

const CLAIM_COLORS: Record<string, ColorClass> = {
  supported: 'bg-green-100 text-green-800 ring-green-200',
  unsupported: 'bg-amber-100 text-amber-800 ring-amber-200',
  contested: 'bg-red-100 text-red-800 ring-red-200',
  unknown: 'bg-gray-100 text-gray-600 ring-gray-200',
  deprecated: 'bg-gray-50 text-gray-400 ring-gray-100',
}

const TASK_COLORS: Record<string, ColorClass> = {
  TODO: 'bg-gray-100 text-gray-600 ring-gray-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 ring-blue-200',
  BLOCKED: 'bg-red-100 text-red-800 ring-red-200',
  AWAITING_REVIEW: 'bg-amber-100 text-amber-800 ring-amber-200',
  DONE: 'bg-green-100 text-green-800 ring-green-200',
  CANCELLED: 'bg-gray-100 text-gray-500 ring-gray-200',
}

const DECISION_COLORS: Record<string, ColorClass> = {
  MADE: 'bg-green-100 text-green-800 ring-green-200',
  IMPLEMENTING: 'bg-blue-100 text-blue-800 ring-blue-200',
  OUTCOME_KNOWN: 'bg-purple-100 text-purple-800 ring-purple-200',
  REVIEWED: 'bg-gray-100 text-gray-600 ring-gray-200',
}

const ASSUMPTION_COLORS: Record<string, ColorClass> = {
  active: 'bg-amber-100 text-amber-800 ring-amber-200',
  validated: 'bg-green-100 text-green-800 ring-green-200',
  invalidated: 'bg-red-100 text-red-800 ring-red-200',
  superseded: 'bg-gray-100 text-gray-500 ring-gray-200',
}

const UNKNOWN_COLORS: Record<string, ColorClass> = {
  open: 'bg-gray-100 text-gray-600 ring-gray-200',
  investigating: 'bg-blue-100 text-blue-800 ring-blue-200',
  resolved: 'bg-green-100 text-green-800 ring-green-200',
  accepted: 'bg-amber-100 text-amber-800 ring-amber-200',
}

const RISK_COLORS: Record<string, ColorClass> = {
  critical: 'bg-red-100 text-red-800 ring-red-200',
  high: 'bg-amber-100 text-amber-800 ring-amber-200',
  medium: 'bg-blue-100 text-blue-800 ring-blue-200',
  low: 'bg-gray-100 text-gray-600 ring-gray-200',
}

const DEFAULT_COLOR = 'bg-amber-100 text-amber-800 ring-amber-200'
const FALLBACK_COLOR = 'bg-gray-100 text-gray-600 ring-gray-200'

function getColorClass(status: string, type: StatusType): ColorClass {
  switch (type) {
    case 'claim':
      return CLAIM_COLORS[status] ?? FALLBACK_COLOR
    case 'task':
      return TASK_COLORS[status] ?? FALLBACK_COLOR
    case 'decision':
      return DECISION_COLORS[status] ?? DEFAULT_COLOR
    case 'assumption':
      return ASSUMPTION_COLORS[status] ?? FALLBACK_COLOR
    case 'unknown':
      return UNKNOWN_COLORS[status] ?? FALLBACK_COLOR
    case 'risk':
      return RISK_COLORS[status] ?? FALLBACK_COLOR
  }
}

function formatLabel(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function StatusBadge({ status, type, className = '' }: StatusBadgeProps) {
  const colorClass = getColorClass(status, type)

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${colorClass} ${className}`}
    >
      {formatLabel(status)}
    </span>
  )
}
