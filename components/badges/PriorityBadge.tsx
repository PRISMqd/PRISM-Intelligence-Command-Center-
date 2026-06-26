'use client'

type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

const PRIORITY_COLORS: Record<Priority, string> = {
  CRITICAL: 'bg-red-100 text-red-800 ring-red-200',
  HIGH: 'bg-amber-100 text-amber-800 ring-amber-200',
  MEDIUM: 'bg-blue-100 text-blue-800 ring-blue-200',
  LOW: 'bg-gray-100 text-gray-600 ring-gray-200',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

export default function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const colorClass = PRIORITY_COLORS[priority] ?? 'bg-gray-100 text-gray-600 ring-gray-200'
  const label = PRIORITY_LABELS[priority] ?? priority

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${colorClass} ${className}`}
    >
      {label}
    </span>
  )
}
