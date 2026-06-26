'use client'

import PanelCard from '@/components/ui/PanelCard'
import EmptyState from '@/components/ui/EmptyState'
import { formatRelativeTime } from '@/lib/utils'

type Confidence = 'low' | 'medium' | 'high'

interface GhostNote {
  id: string
  inference_basis: string
  confidence: Confidence
  created_at: string
}

interface GhostNotesPanelProps {
  ghostNotes: GhostNote[]
}

const CONFIDENCE_CLASSES: Record<Confidence, string> = {
  low: 'bg-gray-100 text-gray-600 border border-gray-200',
  medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  high: 'bg-green-100 text-green-700 border border-green-200',
}

function isNew(createdAt: string): boolean {
  const age = Date.now() - new Date(createdAt).getTime()
  return age < 24 * 60 * 60 * 1000
}

export default function GhostNotesPanel({ ghostNotes }: GhostNotesPanelProps) {
  return (
    <PanelCard
      title="Ghost Notes"
      description="Detected absences and inferred missing knowledge"
    >
      {ghostNotes.length === 0 ? (
        <EmptyState
          icon="👻"
          title="No ghost notes"
          description="The system has no detected absences."
        />
      ) : (
        <div className="space-y-2">
          {ghostNotes.map((note) => (
            <div
              key={note.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize ${CONFIDENCE_CLASSES[note.confidence]}`}
                  >
                    {note.confidence}
                  </span>
                  {isNew(note.created_at) && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                      NEW
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {formatRelativeTime(note.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-snug">{note.inference_basis}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  )
}
