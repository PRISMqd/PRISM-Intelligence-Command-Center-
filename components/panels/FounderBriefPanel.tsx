'use client'

import { useRouter } from 'next/navigation'
import { RefreshCw, Loader2 } from 'lucide-react'
import PanelCard from '@/components/ui/PanelCard'
import EmptyState from '@/components/ui/EmptyState'
import { formatRelativeTime } from '@/lib/utils'

interface FocusItem {
  id: string
  title: string
  focus_score: number
  description?: string
}

interface FounderBrief {
  id: string
  date: string
  generated_at: string
  focus_items: FocusItem[]
}

interface FounderBriefPanelProps {
  brief: FounderBrief | null
  onRegenerate?: () => void
}

function FocusScoreBadge({ score }: { score: number }) {
  if (score >= 0.8) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-600 text-white min-w-[2.5rem] justify-center">
        {Math.round(score * 100)}
      </span>
    )
  }
  if (score >= 0.5) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500 text-white min-w-[2.5rem] justify-center">
        {Math.round(score * 100)}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border border-gray-300 text-gray-600 bg-white min-w-[2.5rem] justify-center">
      {Math.round(score * 100)}
    </span>
  )
}

export default function FounderBriefPanel({ brief, onRegenerate }: FounderBriefPanelProps) {
  const dateLabel = brief
    ? new Date(brief.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : null

  const lastGenerated = brief ? formatRelativeTime(brief.generated_at) : null

  const actions = (
    <button
      onClick={onRegenerate}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      Regenerate
    </button>
  )

  return (
    <PanelCard
      title={dateLabel ?? "Founder Brief"}
      description={lastGenerated ? `Last generated ${lastGenerated}` : undefined}
      actions={actions}
    >
      {!brief ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <p className="text-sm text-gray-500">No brief generated yet. Generating...</p>
        </div>
      ) : brief.focus_items.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No focus items"
          description="The brief was generated but contains no focus items."
        />
      ) : (
        <ol className="space-y-2">
          {brief.focus_items.map((item, idx) => (
            <li
              key={item.id}
              onClick={() => console.log('Focus item clicked:', item)}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
            >
              <span className="text-xs font-bold text-gray-400 mt-0.5 w-4 shrink-0 text-right">
                {idx + 1}
              </span>
              <span className="flex-1 text-sm text-gray-800 group-hover:text-gray-900 leading-snug min-w-0">
                {item.title}
                {item.description && (
                  <span className="block text-xs text-gray-500 mt-0.5">{item.description}</span>
                )}
              </span>
              <FocusScoreBadge score={item.focus_score} />
            </li>
          ))}
        </ol>
      )}
    </PanelCard>
  )
}
