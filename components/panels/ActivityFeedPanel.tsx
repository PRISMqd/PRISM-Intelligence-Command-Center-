'use client'

import { useState } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Link,
  CheckCircle,
  AlertOctagon,
} from 'lucide-react'
import PanelCard from '@/components/ui/PanelCard'
import EmptyState from '@/components/ui/EmptyState'
import { formatRelativeTime } from '@/lib/utils'

type EventType = 'CREATED' | 'UPDATED' | 'DELETED' | 'LINKED' | 'VERIFIED' | 'CONTRADICTED'
type FilterType = 'all' | 'claim' | 'evidence' | 'decision' | 'assumption' | 'task'

interface ProvenanceEvent {
  id: string
  event_type: EventType
  actor: string
  object_name: string
  object_type: string
  created_at: string
}

interface ActivityFeedPanelProps {
  initialEvents: ProvenanceEvent[]
}

const EVENT_ICONS: Record<EventType, React.ReactNode> = {
  CREATED: <Plus className="w-4 h-4 text-green-600" />,
  UPDATED: <Edit2 className="w-4 h-4 text-blue-600" />,
  DELETED: <Trash2 className="w-4 h-4 text-red-500" />,
  LINKED: <Link className="w-4 h-4 text-purple-600" />,
  VERIFIED: <CheckCircle className="w-4 h-4 text-green-700" />,
  CONTRADICTED: <AlertOctagon className="w-4 h-4 text-red-600" />,
}

const EVENT_VERB: Record<EventType, string> = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  LINKED: 'linked',
  VERIFIED: 'verified',
  CONTRADICTED: 'contradicted',
}

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'claim', label: 'Claims' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'decision', label: 'Decisions' },
  { value: 'assumption', label: 'Assumptions' },
  { value: 'task', label: 'Tasks' },
]

const PAGE_SIZE = 20

export default function ActivityFeedPanel({ initialEvents }: ActivityFeedPanelProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filtered =
    filter === 'all'
      ? initialEvents
      : initialEvents.filter((e) =>
          e.object_type.toLowerCase().includes(filter)
        )

  const visible = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

  const filterActions = (
    <select
      value={filter}
      onChange={(e) => {
        setFilter(e.target.value as FilterType)
        setVisibleCount(PAGE_SIZE)
      }}
      className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300"
    >
      {FILTER_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )

  return (
    <PanelCard title="Activity Feed" description="Recent system events" actions={filterActions}>
      {visible.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No activity yet"
          description="The system is waiting for its first objects."
        />
      ) : (
        <div className="space-y-0">
          {visible.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0"
            >
              <div className="mt-0.5 shrink-0">
                {EVENT_ICONS[event.event_type] ?? <Edit2 className="w-4 h-4 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-snug">
                  <span className="font-medium">{event.actor}</span>{' '}
                  <span className="text-gray-500">{EVENT_VERB[event.event_type]}</span>{' '}
                  <span className="font-medium">{event.object_name}</span>
                </p>
              </div>
              <span className="text-xs text-gray-400 shrink-0 mt-0.5 whitespace-nowrap">
                {formatRelativeTime(event.created_at)}
              </span>
            </div>
          ))}
          {hasMore && (
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="w-full pt-3 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </PanelCard>
  )
}
